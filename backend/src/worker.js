import 'dotenv/config';
import { supabase } from './services/supabaseService.js';
import { generateChatResponse, generateJsonContent } from './services/geminiService.js';
import { generateImage } from './services/imageService.js';
import { searchInfluencers } from './services/serperService.js';

const POLLING_INTERVAL = 5000;

/**
 * The main loop of the worker. Atomically fetches and processes pending tasks.
 */
async function processTasks() {
  console.log('🔎 Checking for pending tasks...');

  // --- START: ROBUST FETCH LOGIC ---
  // 1. Atomically fetch and lock a batch of pending tasks using the DB function
  const { data: tasks, error: fetchError } = await supabase
    .rpc('fetch_and_lock_tasks', { limit_count: 5 });
  // --- END: ROBUST FETCH LOGIC ---

  if (fetchError) {
    console.error('Error fetching tasks:', fetchError);
    return;
  }
  if (tasks.length === 0) {
    return;
  }

  console.log(`- Found and locked ${tasks.length} tasks. Starting processing...`);

  for (const task of tasks) {
    // The tasks are already marked as 'in_progress' by the RPC function.
    try {
      console.log(`  - Processing task ${task.id} (Type: ${task.type})`);
      switch (task.type) {
        case 'image_generate':
          await handleImageGeneration(task);
          break;
        case 'copy_generate':
          await handleCopyGeneration(task);
          break;
        case 'influencer_search':
          await handleInfluencerSearch(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      // Mark the task as completed
      await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date() })
        .eq('id', task.id);
      
      console.log(`  - ✅ Task ${task.id} completed successfully.`);
    } catch (err) {
      // If an error occurs, mark the task as failed
      console.error(`  - ❌ Error processing task ${task.id}:`, err.message);
      await supabase
        .from('tasks')
        .update({ status: 'failed', error_message: err.message, completed_at: new Date() })
        .eq('id', task.id);
    }
  }
}

/**
 * Handles image generation, uploads to storage, and saves the asset record.
 */
async function handleImageGeneration(task) {
  const imageBuffer = await generateImage(task.meta.prompt);
  const filePath = `${task.campaign_id}/${task.id}.png`;
  const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, imageBuffer, { contentType: 'image/png', upsert: true });
  if (uploadError) throw uploadError;
  const { error: insertError } = await supabase.from('assets').insert({ campaign_id: task.campaign_id, task_id: task.id, storage_path: filePath, metadata: task.meta });
  if (insertError) throw insertError;
}

/**
 * Handles copy generation and saves the copy record.
 */
async function handleCopyGeneration(task) {
  const generatedText = await generateChatResponse(task.meta.prompt);
  const { error: insertError } = await supabase.from('copies').insert({ campaign_id: task.campaign_id, task_id: task.id, type: task.meta.copy_type, content: generatedText, metadata: task.meta });
  if (insertError) throw insertError;
}

/**
 * Handles influencer search, AI analysis, and saving to the database.
 */
async function handleInfluencerSearch(task) {
  const searchResults = await searchInfluencers(task.meta.query);
  if (!searchResults || searchResults.length === 0) {
    console.warn("      - Serper returned no results. Skipping influencer task.");
    return;
  }
  const analysisPrompt = getInfluencerAnalysisPrompt(task.meta.theme, searchResults);
  const analyzedInfluencers = await generateJsonContent(analysisPrompt);
  if (!analyzedInfluencers || !Array.isArray(analyzedInfluencers) || analyzedInfluencers.length === 0) {
    console.warn("      - Gemini returned no influencers. Skipping database inserts.");
    return;
  }
  for (const influencer of analyzedInfluencers) {
    const { data: influencerData, error: upsertError } = await supabase.from('influencers').upsert({ name: influencer.name, profile_url: influencer.profile_url, platform: influencer.platform, notes: influencer.notes || `Identified for campaign: ${task.meta.theme}` }, { onConflict: 'profile_url' }).select('id').single();
    if (upsertError) {
      console.error(`      - Error saving influencer "${influencer.name}":`, upsertError);
      continue;
    }
    const { error: tipError } = await supabase.from('campaign_influencer_tips').insert({ campaign_id: task.campaign_id, influencer_id: influencerData.id, tip: influencer.tip });
    if (tipError) {
      console.error(`      - Error saving tip for "${influencer.name}":`, tipError);
    }
  }
}

/**
 * Helper function to create the prompt for Gemini to analyze search results.
 */
function getInfluencerAnalysisPrompt(theme, searchResults) {
  return `
# ROLE: AI Influencer Strategist
You are an expert AI that analyzes search results to identify and create strategies for potential influencer collaborations.

## CONTEXT
- **Campaign Theme:** "${theme}"
- **Raw Google Search Results (from Serper.ai):**
\`\`\`json
${JSON.stringify(searchResults.slice(0, 10), null, 2)}
\`\`\`

## YOUR TASK
1.  Analyze the provided search results to identify 3-5 potential influencers who are a good fit for the campaign theme.
2.  For each influencer you identify, create a concise, strategic "tip" for collaboration. This tip should suggest a specific angle or content idea.
3.  Extract their name, profile URL, and platform (must be "instagram" or "linkedin").
4.  Your entire response MUST be a single, valid JSON array following the schema below. Do not include any text before or after the JSON array.

## JSON OUTPUT SCHEMA
[
  {
    "name": "string",
    "profile_url": "string (the direct URL to their profile)",
    "platform": "instagram" | "linkedin",
    "tip": "string (A strategic collaboration idea)",
    "notes": "string (A brief justification for why they are a good fit)"
  }
]
`;
}

// --- Worker Initialization ---
console.log('🚀 Background Worker started.');
console.log(`Polling for tasks every ${POLLING_INTERVAL / 1000} seconds.`);
processTasks();
setInterval(processTasks, POLLING_INTERVAL);