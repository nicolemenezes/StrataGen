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