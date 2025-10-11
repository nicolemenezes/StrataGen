// /backend/src/services/orchestrationService.js

import { supabase } from './supabaseService.js';
import { generateChatResponse } from './geminiService.js';

export async function queueAssetGenerationTasks(campaignId, highLevelStrategy) {
  try {
    const expansionPrompt = getExpansionPrompt(highLevelStrategy);
    const detailedDaysJsonString = await generateChatResponse(expansionPrompt);
    // This regular expression finds the content between the first '[' and the last ']'
    const jsonMatch = detailedDaysJsonString.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error("AI response did not contain a valid JSON array.");
    }
    const cleanJsonString = jsonMatch[0];
    const detailedDays = JSON.parse(cleanJsonString);

    if (!detailedDays || !Array.isArray(detailedDays)) {
      throw new Error("AI failed to generate a valid 'days' array for orchestration.");
    }

    const tasksToInsert = [];
    for (const day of detailedDays) {
      if (day.platform === 'instagram' && day.content_type === 'post') {
        tasksToInsert.push({
          campaign_id: campaignId, type: 'image_generate', status: 'pending',
          meta: { day: day.day, platform: day.platform, prompt: day.generation_prompt }
        });
        tasksToInsert.push({
          campaign_id: campaignId, type: 'copy_generate', status: 'pending',
          meta: { day: day.day, platform: day.platform, copy_type: 'caption', prompt: day.generation_prompt, brand_tone: highLevelStrategy.brand_tone }
        });
      } else if (day.platform === 'linkedin' && day.content_type === 'blog post') {
        tasksToInsert.push({
          campaign_id: campaignId, type: 'copy_generate', status: 'pending',
          meta: { day: day.day, platform: day.platform, copy_type: 'blog_title', prompt: `Generate a compelling, professional blog title based on this creative brief: ${day.generation_prompt}` }
        });
        tasksToInsert.push({
          campaign_id: campaignId, type: 'copy_generate', status: 'pending',
          meta: { day: day.day, platform: day.platform, copy_type: 'blog_body', prompt: `Write a full, insightful LinkedIn blog post using this creative brief: ${day.generation_prompt}. Adopt the brand tone: ${highLevelStrategy.brand_tone}` }
        });
      }
    }

    if (highLevelStrategy.influencer_query) {
      tasksToInsert.push({
        campaign_id: campaignId, type: 'influencer_search', status: 'pending',
        meta: { query: highLevelStrategy.influencer_query, theme: highLevelStrategy.theme }
      });
    }

    if (tasksToInsert.length > 0) {
      const { error } = await supabase.from('tasks').insert(tasksToInsert);
      if (error) throw error;
    }

    await supabase.from('campaigns').update({ status: 'assets_generating' }).eq('id', campaignId);
    console.log(`✅ Successfully queued ${tasksToInsert.length} tasks for campaign ${campaignId}.`);

  } catch (error) {
    console.error(`❌ Orchestration failed for campaign ${campaignId}:`, error);
    await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId);
  }
}

const getExpansionPrompt = (highLevelStrategy) => `
# ROLE: AI Creative Director
You are an expert Creative Director AI. Your job is to take a high-level marketing plan and expand its simple concepts into detailed, creative briefs for other AI models to use for asset generation.

## High-Level Plan
\`\`\`json
${JSON.stringify(highLevelStrategy, null, 2)}
\`\`\`

## YOUR TASK
Rewrite the "days" array from the plan above. For each day, you MUST transform the simple "concept" into a highly detailed, multi-sentence "generation_prompt". This new prompt must be a rich, creative brief that includes specifics about visuals, mood, key messages, and calls to action, drawing from the overall theme and brand tone.

## CONSTRAINTS
- Your output MUST be ONLY the rewritten JSON for the "days" array. 
- Do not output the full JSON object, only the array itself, like this: \`[ { ... }, { ... } ]\`
`;