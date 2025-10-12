// /backend/src/controllers/campaignController.js

import { supabase } from '../services/supabaseService.js';
import { generateChatResponse, generateJsonContent } from '../services/geminiService.js';
import { queueAssetGenerationTasks } from '../services/orchestrationService.js';

// --- STRATEGY & CHAT FLOW ---

export const createStrategyAndChat = async (req, res) => {
  const { title, brief } = req.body;
  const userId = req.auth.sub;
  try {
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .insert({ user_id: userId, title, brief, status: 'strategy_draft' })
      .select('id')
      .single();
    if (campaignError) throw campaignError;
    const campaignId = campaignData.id;

    await supabase.from('strategy_chats').insert({
      campaign_id: campaignId,
      role: 'user',
      content: brief
    });

    const conversation = `**USER**: ${brief}`;
    const prompt = getChatPrompt(conversation);
    const aiResponse = await generateChatResponse(prompt);

    await supabase.from('strategy_chats').insert({
      campaign_id: campaignId,
      role: 'assistant',
      content: aiResponse
    });

    res.status(201).json({
      campaign_id: campaignId,
      initial_reply: aiResponse
    });
  } catch (error) {
    console.error("Failed to create strategy and start chat:", error);
    res.status(500).json({ message: "Failed to create campaign." });
  }
};

export const getAllCampaigns = async (req, res) => {
  const userId = req.auth.sub;
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, title, status, created_at') // Only select data needed for the dashboard
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // Show newest first

    if (error) throw error;

    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Failed to retrieve campaigns:", error.message);
    res.status(500).json({ message: "Failed to retrieve campaigns." });
  }
};

export const continueChat = async (req, res) => {
  const { campaignId } = req.params;
  const { message } = req.body;
  try {
    await supabase.from('strategy_chats').insert({ campaign_id: campaignId, role: 'user', content: message });
    const { data: chatHistory } = await supabase.from('strategy_chats').select('role, content').eq('campaign_id', campaignId).order('created_at');
    const conversation = chatHistory.map(m => `**${m.role.toUpperCase()}**: ${m.content}`).join('\n\n');
    const prompt = getChatPrompt(conversation);
    const aiResponse = await generateChatResponse(prompt);
    await supabase.from('strategy_chats').insert({ campaign_id: campaignId, role: 'assistant', content: aiResponse });
    res.status(200).json({ reply: aiResponse });
  } catch (error) {
    console.error("Chat continuation failed:", error);
    res.status(500).json({ message: "Failed to get AI response." });
  }
};

export const approveStrategy = async (req, res) => {
  const { campaignId } = req.params;
  try {
    const { data: lastAssistantMessage, error: historyError } = await supabase
      .from('strategy_chats')
      .select('content')
      .eq('campaign_id', campaignId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (historyError || !lastAssistantMessage) {
      return res.status(400).json({ message: "No final strategy found to approve." });
    }
    const finalMarkdownPlan = lastAssistantMessage.content;
    const conversionPrompt = getJsonConversionPrompt(finalMarkdownPlan);
    const highLevelStrategy = await generateJsonContent(conversionPrompt);

    await supabase.from('campaigns').update({
      strategy: highLevelStrategy,
      status: 'strategy_approved',
      approved: true,
    }).eq('id', campaignId);
    
    queueAssetGenerationTasks(campaignId, highLevelStrategy);
    
    res.status(200).json({ message: "Strategy approved! Generating detailed plan and queuing assets..." });
  } catch (error) {
    console.error("Approval failed:", error.message);
    res.status(500).json({ message: "Failed to approve strategy." });
  }
};

// /backend/src/controllers/campaignController.js

// /backend/src/controllers/campaignController.js

export const getCampaignData = async (req, res) => {
  // --- START: DEBUG LOGGING ---
  console.log('--- TRIGGERED: GET /api/campaigns/:id ---');
  
  const { campaignId } = req.params;
  const userId = req.auth.sub;

  console.log('1. Attempting to fetch data for Campaign ID:', campaignId);
  console.log('2. Authenticated User ID (from JWT):', userId);
  // --- END: DEBUG LOGGING ---

  try {
    // 👇 THIS QUERY IS NOW CORRECTED 👇
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        tasks(*),
        assets(*),
        copies(*),
        campaign_influencer_tips(*, influencers(*)) 
      `)
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();
    
    if (error || !campaign) {
      console.log('3. ❌ Query Result: Campaign NOT FOUND for this user.');
      if (error) {
        console.error('   - Supabase error:', error.message);
      } else {
        console.log('   - Reason: No campaign matched BOTH the Campaign ID and the User ID.');
      }
      return res.status(404).json({ message: "Campaign not found or you do not have access." });
    }

    console.log('3. ✅ Query Result: Campaign found successfully!');
    res.status(200).json(campaign);

  } catch (error) {
    console.error("4. ❌ Critical Error in getCampaignData:", error.message);
    res.status(500).json({ message: "Failed to retrieve campaign data." });
  }
};

export const regenerateAsset = async (req, res) => {
  const { assetId } = req.params;
  const { feedback } = req.body;
  const userId = req.auth.sub;

  if (!feedback) {
    return res.status(400).json({ message: "Feedback is required for regeneration." });
  }
  try {
    const { data: originalAsset, error: assetError } = await supabase
      .from('assets')
      .select('*, tasks!inner(*, campaigns!inner(user_id))')
      .eq('id', assetId)
      .single();

    if (assetError || !originalAsset || originalAsset.tasks.campaigns.user_id !== userId) {
      return res.status(404).json({ message: "Asset not found or you don't have access." });
    }

    const originalTask = originalAsset.tasks;
    const refinementPrompt = `You are a creative director AI. Your task is to refine an image generation prompt based on user feedback.\n\n**Original Prompt:** "${originalTask.meta.prompt}"\n\n**User Feedback:** "${feedback}"\n\n**Your Task:** Rewrite the original prompt to incorporate the user's feedback. Intelligently merge the ideas into a single, cohesive, new prompt. Output ONLY the new prompt text.`;
    const newPrompt = await generateChatResponse(refinementPrompt);

    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert({
        campaign_id: originalTask.campaign_id,
        type: originalTask.type,
        status: 'pending',
        meta: { ...originalTask.meta, prompt: newPrompt, regenerated_from_task: originalTask.id }
      })
      .select('id')
      .single();

    if (insertError) throw insertError;
    
    res.status(201).json({ message: "Regeneration task has been queued.", new_task_id: newTask.id });
  } catch (error) {
    console.error("Regeneration failed:", error.message);
    res.status(500).json({ message: "Failed to queue regeneration task." });
  }
};

export const getChatHistory = async (req, res) => {
  const { campaignId } = req.params;
  const userId = req.auth.sub;
  try {
    const { data: history, error } = await supabase
      .from('strategy_chats')
      .select('role, content, campaigns!inner(user_id)')
      .eq('campaign_id', campaignId)
      .eq('campaigns.user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!history) return res.status(404).json({ message: "Campaign not found or access denied." });

    const cleanHistory = history.map(({ role, content }) => ({ role, content }));
    res.status(200).json(cleanHistory);
  } catch (error) {
    console.error("Failed to get chat history:", error);
    res.status(500).json({ message: "Failed to retrieve chat history." });
  }
};

export const updateCopyContent = async (req, res) => {
  const { copyId } = req.params;
  const { content } = req.body;
  const userId = req.auth.sub;

  if (!content) {
    return res.status(400).json({ message: "Content cannot be empty." });
  }

  try {
    // ✅ START: REVISED OWNERSHIP CHECK
    // First, get the copy and its parent campaign ID.
    const { data: copy, error: fetchError } = await supabase
      .from('copies')
      .select('campaign_id')
      .eq('id', copyId)
      .single();

    if (fetchError || !copy) {
      return res.status(404).json({ message: "Copy not found." });
    }

    // Next, verify the user owns the parent campaign.
    const { data: campaign, error: ownerError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', copy.campaign_id)
      .eq('user_id', userId)
      .single();

    if (ownerError || !campaign) {
      return res.status(403).json({ message: "You do not have access to edit this content." });
    }
    // ✅ END: REVISED OWNERSHIP CHECK

    // If the checks pass, perform the update.
    const { error: updateError } = await supabase
      .from('copies')
      .update({ content, updated_at: new Date() })
      .eq('id', copyId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Content updated successfully." });
  } catch (error) {
    console.error("Failed to update copy content:", error);
    res.status(500).json({ message: "Failed to update content." });
  }
};


// ✅ NEW CONTROLLER FUNCTION (FEATURE 2: AI COMMAND BAR)
// ✅ NEW CONTROLLER FUNCTION (FEATURE 2: AI COMMAND BAR)
export const handleCommand = async (req, res) => {
  const { campaignId } = req.params;
  const { prompt: userCommand } = req.body;
  const userId = req.auth.sub;

  try {
    // 1. Fetch the campaign to verify ownership and get context
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('strategy, assets(*), copies(*)')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    // 2. Use an AI to interpret the user's command into a structured action
    const routerPrompt = getCommandRouterPrompt(userCommand, campaign.strategy);
    const actionJson = await generateJsonContent(routerPrompt);

    // 3. Execute the action determined by the AI
    switch (actionJson.action) {
      case 'regenerate_image': {
        const { day, feedback } = actionJson.params;
        const originalAsset = campaign.assets.find(a => a.metadata.day === day);
        if (!originalAsset) throw new Error(`No asset found for day ${day}`);

        const refinementPrompt = `Based on the original prompt: "${originalAsset.metadata.prompt}", incorporate this feedback: "${feedback}". Output only the new, single, refined image generation prompt.`;
        const newPrompt = await generateChatResponse(refinementPrompt);

        await supabase.from('tasks').insert({
          campaign_id: campaignId,
          type: 'image_generate',
          status: 'pending',
          meta: { ...originalAsset.metadata, prompt: newPrompt, feedback }
        });
        break;
      }
      
      case 'regenerate_copy': {
        const { day, type, feedback } = actionJson.params;
        const originalCopy = campaign.copies.find(c => c.metadata.day === day && c.type === type);
        if (!originalCopy) throw new Error(`No copy of type '${type}' found for day ${day}`);

        const concept = campaign.strategy.days.find(d => d.day === day)?.concept || 'the campaign theme';
        const refinementPrompt = `The overall concept is: "${concept}". The original copy was: "${originalCopy.content}". The user's feedback is: "${feedback}". Please generate a new version of the copy incorporating the feedback.`;
        const newContent = await generateChatResponse(refinementPrompt);

        await supabase.from('copies').insert({
            campaign_id: campaignId,
            type: originalCopy.type,
            content: newContent,
            metadata: { ...originalCopy.metadata, feedback, regenerated_from: originalCopy.id }
        });
        break;
      }

      case 'regenerate_influencers': {
        const { feedback } = actionJson.params;

        // ✅ START: CORRECTED PROMPT FOR INFLUENCER REGENERATION
        const newQueryPrompt = `
            You are an AI assistant that generates a single, concise search query string.
            An original search query for influencers was: "${campaign.strategy.influencer_query}".
            The user has new feedback: "${feedback}".
            
            Your Task: Create a new, single-line search query string optimized for an API like Serper.ai based on the feedback.

            ABSOLUTE RULES:
            1. Your ENTIRE response MUST be ONLY the single search query string.
            2. DO NOT include any explanations, markdown, formatting, or introductory text like "Here is the query:".
            3. The query must be short and effective for a web search API.

            Example:
            Feedback: "find me food bloggers in New York"
            Your Output:
            food bloggers in New York City instagram
        `;
        const newInfluencerQuery = await generateChatResponse(newQueryPrompt);
        // ✅ END: CORRECTED PROMPT

        await supabase.from('tasks').insert({
          campaign_id: campaignId,
          type: 'influencer_search',
          status: 'pending',
          meta: { query: newInfluencerQuery, theme: campaign.strategy.theme }
        });
        // Also clear old tips
        await supabase.from('campaign_influencer_tips').delete().eq('campaign_id', campaignId);
        break;
      }

      default:
        return res.status(400).json({ message: "Sorry, I couldn't understand that command." });
    }

    res.status(202).json({ message: "Regeneration task has been queued!" });
  } catch (error) {
    console.error("Failed to handle command:", error);
    res.status(500).json({ message: "Failed to process your command." });
  }
};

// ✅ NEW HELPER PROMPT FOR THE COMMAND ROUTER
const getCommandRouterPrompt = (userCommand, strategy) => `
# ROLE: AI Command Interpreter
You are an expert at interpreting a user's natural language command into a structured JSON action.

## CONTEXT
- The user is looking at a social media campaign plan.
- The plan has multiple days, each with content (images, captions, blogs).
- The plan also has a list of influencers.
- Campaign Strategy: ${JSON.stringify(strategy)}

## USER COMMAND
"${userCommand}"

## YOUR TASK
Analyze the user's command and the campaign context. Determine the user's primary intent and convert it into a single JSON object with an "action" and "params".

## AVAILABLE ACTIONS & REQUIRED PARAMS
1.  **action: "regenerate_image"**
    -   Identify which day the user wants to change.
    -   Extract the user's creative feedback.
    -   **Required params:** { "day": <number>, "feedback": "<string>" }

2.  **action: "regenerate_influencers"**
    -   The user wants to find different influencers.
    -   Extract the user's new criteria.
    -   **Required params:** { "feedback": "<string>" }
    
3.  **action: "regenerate_copy"**
    - The user wants to change the text for a specific day.
    - Identify the day number and creative feedback.
    - Determine the type of copy (e.g., 'caption', 'blog_title', 'blog_body').
    - **Required params:** { "day": <number>, "type": "<'caption'|'blog_title'|'blog_body'>", "feedback": "<string>" }

## OUTPUT RULES
- Your ENTIRE response MUST be ONLY the single, valid JSON object.
- If you cannot determine a valid action, output: { "action": "unknown" }

### Example
User Command: "change the picture for day 1 to be more futuristic"
Your Output:
{
  "action": "regenerate_image",
  "params": {
    "day": 1,
    "feedback": "make it more futuristic"
  }
}

### Example 2
User Command: "rewrite the caption for day 2 to be funnier"
Your Output:
{
  "action": "regenerate_copy",
  "params": {
    "day": 2,
    "type": "caption",
    "feedback": "make it funnier"
  }
}
`;



// --- HELPER FUNCTIONS FOR PROMPTS ---

const getChatPrompt = (conversation) => `
# ROLE: AI Social Media Campaign Strategist
You are an expert AI that designs structured campaign plans. You are a tool, not a conversationalist. Your goal is to take user requests and immediately generate or refine a campaign plan in a specific Markdown format.

## CONVERSATION HISTORY
Analyze the entire conversation below. The last message from the USER is your primary instruction.
${conversation}

## YOUR TASK & ABSOLUTE RULES
1.  **PRIORITIZE USER CONSTRAINTS:** Look for specific numbers and keywords in the USER's last message (e.g., "2 days", "budget $500", "3 instagram posts"). These are **NON-NEGOTIABLE** commands that you MUST obey. If the user says "2 days", you generate a 2-day calendar. NO EXCEPTIONS.
2.  **GENERATE A FULL PLAN:** Always respond with the full, updated campaign plan in Markdown.
3.  **STRICTLY ADHERE TO FORMATTING:**
    * **PLATFORMS:** You can ONLY use \`instagram\` and \`linkedin\`.
    * **CONTENT TYPES:** You can ONLY use \`post\` and \`blog post\`.
    * **FORBIDDEN CONTENT:** Do NOT include Reels, videos, Stories, or Challenges.
    * **MARKDOWN ONLY:** Your entire response MUST be in the specified Markdown format.
    * **\`linkedin\` posts MUST be "blog post" content types and instgram posts MUST be "post" content types.

## MARKDOWN OUTPUT FORMAT
### Theme
*Your creative campaign theme.*
### Brand Tone
*Adjectives describing the tone of voice.*
### Color Palette
- #HexCode1
- #HexCode2
### Hashtags
- #Hashtag1
- #Hashtag2
### Suggested Budget (USD)
**$XXXX** - *Brief notes on the budget.*
### Posting Schedule
*Brief description of posting times.*
### Influencer Query
*Concise query for finding influencers.*
### Campaign Calendar
| Day | Platform  | Content Type | Concept                               |
|-----|-----------|--------------|---------------------------------------|
| 1   | instagram | post         | Brief concept for Day 1 content.      |
| ... | ...       | ...          | ...                                   |
`;

const getJsonConversionPrompt = (markdownPlan) => `
# ROLE: AI Data Parser
Your input is a social media campaign plan in Markdown. Your task is to accurately convert this into a single, valid JSON object.

## INPUT MARKDOWN
${markdownPlan}

## YOUR TASK
Extract all data from the Markdown and map it to the corresponding fields in the JSON schema below. Your entire response MUST be the JSON object and nothing else.

## JSON OUTPUT SCHEMA
{
  "theme": "string",
  "brand_tone": "string",
  "color_palette": ["string"],
  "hashtags": ["string"],
  "suggested_budget": "number",
  "budget_notes": "string",
  "days": [
    {
      "day": "number",
      "platform": "string (one of: instagram, linkedin)",
      "content_type": "string (one of: post, blog post)",
      "concept": "string"
    }
  ],
  "influencer_query": "string",
  "posting_schedule": "string"
}
`;