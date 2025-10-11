// /backend/src/services/orchestrationService.js

import { supabase } from './supabaseService.js';
import { generateChatResponse } from './geminiService.js'; // We need the powerful model for this

/**
 * Parses the strategy JSON, expands it with a powerful AI, and creates tasks.
 * @param {string} campaignId - The ID of the campaign.
 *
 * @param {object} highLevelStrategy - The approved high-level strategy JSON.
 */
export async function queueAssetGenerationTasks(campaignId, highLevelStrategy) {
  try {
    // ✨ New Step 1: Use a powerful AI (Gemini 1.5 Pro) to expand the high-level plan.
    const expansionPrompt = `
      You are an expert Creative Director AI. Your job is to take a high-level marketing plan and expand it into a detailed execution plan with rich, creative prompts for other AI models to use.

      Here is the high-level plan:
      ${JSON.stringify(highLevelStrategy, null, 2)}

      **Your Task:**
      Rewrite the "days" array. For each day, transform the simple "concept" into a highly detailed, multi-sentence "generation_prompt". This new prompt should include specifics about visuals, tone, key messages, and calls to action.

      **Output ONLY the rewritten JSON for the "days" array.** Do not output the full JSON object, just the array itself, like this:
      [
        { "day": 1, "platform": "...", "content_type": "...", "concept": "...", "generation_prompt": "A very detailed new prompt..." },
        { "day": 2, "platform": "...", "content_type": "...", "concept": "...", "generation_prompt": "Another very detailed prompt..." }
      ]
    `;

    // Use the powerful `chatModel` (Gemini Pro) to get the detailed prompts.
    const detailedDaysJsonString = await generateChatResponse(expansionPrompt);
    const detailedDays = JSON.parse(detailedDaysJsonString);

    // ✨ Step 2: Create tasks using the NEW detailed prompts.
    if (!detailedDays || !Array.isArray(detailedDays)) {
      throw new Error("AI failed to generate a valid 'days' array.");
    }

    const tasksToInsert = [];
    for (const day of detailedDays) {
      if (day.content_type === 'post') {
        tasksToInsert.push({
          campaign_id: campaignId,
          type: 'image_generate',
          status: 'pending',
          meta: { day: day.day, platform: day.platform, prompt: day.generation_prompt }
        });
        tasksToInsert.push({
          campaign_id: campaignId,
          type: 'copy_generate',
          status: 'pending',
          meta: { day: day.day, platform: day.platform, copy_type: 'caption', prompt: day.generation_prompt, brand_tone: highLevelStrategy.brand_tone }
        });
      } else if (day.content_type === 'blog') {
        tasksToInsert.push({
          campaign_id: campaignId,
          type: 'copy_generate',
          status: 'pending',
          meta: { day: day.day, platform: day.platform, copy_type: 'blog_title', prompt: day.generation_prompt }
        });
        tasksToInsert.push({
          campaign_id: campaignId,
          type: 'copy_generate',
          status: 'pending',
          meta: { day: day.day, platform: day.platform, copy_type: 'blog_body', prompt: day.generation_prompt, brand_tone: highLevelStrategy.brand_tone }
        });
      }
    }

    if (tasksToInsert.length > 0) {
      const { error } = await supabase.from('tasks').insert(tasksToInsert);
      if (error) throw error;
    }

    // Update the campaign status to show that assets are now generating.
    await supabase.from('campaigns').update({ status: 'assets_generating' }).eq('id', campaignId);
    console.log(`Successfully queued ${tasksToInsert.length} tasks for campaign ${campaignId}.`);

  } catch (error) {
    console.error(`Orchestration failed for campaign ${campaignId}:`, error);
    // If orchestration fails, update the campaign status to 'failed'.
    await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId);
  }
}