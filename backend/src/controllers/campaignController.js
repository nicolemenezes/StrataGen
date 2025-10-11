import { supabase } from '../services/supabaseService.js';
import { generateInitialStrategy, refineStrategyWithAI } from '../services/openAIService.js';
import { queueAssetGenerationTasks } from '../services/orchestrationService.js';

/**
 * Creates a new campaign and generates the initial strategy.
 * @route POST /api/campaigns/strategize
 */
export const createStrategy = async (req, res) => {
  const { title, brief } = req.body;
  const userId = req.auth.sub; // User ID from the validated JWT

  if (!title || !brief) {
    return res.status(400).json({ message: 'Title and brief are required.' });
  }

  try {
    // Step 1: Create the initial campaign record in the database.
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        title,
        brief,
        status: 'strategy_draft',
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Step 2: Call the AI service to generate the strategy.
    const strategyJson = await generateInitialStrategy(brief);

    // Step 3: Update the campaign with the newly generated strategy.
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update({ strategy: strategyJson })
      .eq('id', campaign.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(201).json(updatedCampaign);
  } catch (error) {
    console.error('Error creating strategy:', error);
    res.status(500).json({ message: 'Failed to create campaign strategy.', error: error.message });
  }
};

/**
 * Refines an existing campaign strategy based on user feedback.
 * @route POST /api/campaigns/:id/refine-strategy
 */
export const refineStrategy = async (req, res) => {
  const { id } = req.params;
  const { refinement_prompt } = req.body;
  const userId = req.auth.sub;

  if (!refinement_prompt) {
    return res.status(400).json({ message: 'A refinement prompt is required.' });
  }

  try {
    // Step 1: Fetch the current campaign to get the existing strategy.
    const { data: currentCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('strategy')
      .eq('id', id)
      .eq('user_id', userId) // Security: Ensure user owns the campaign
      .single();

    if (fetchError) {
        return res.status(404).json({ message: 'Campaign not found or you do not have permission to access it.' });
    }
    if (!currentCampaign.strategy) {
        return res.status(400).json({ message: 'Campaign has no initial strategy to refine.' });
    }

    // Step 2: Call the AI service with the current strategy and the new prompt.
    const refinedStrategyJson = await refineStrategyWithAI(currentCampaign.strategy, refinement_prompt);

    // Step 3: Update the campaign with the refined strategy.
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update({ strategy: refinedStrategyJson })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json(updatedCampaign);
  } catch (error) {
    console.error('Error refining strategy:', error);
    res.status(500).json({ message: 'Failed to refine campaign strategy.', error: error.message });
  }
};

/**
 * Approves a strategy and queues all necessary tasks for asset generation.
 * @route POST /api/campaigns/:id/generate-assets
 */
export const generateAssets = async (req, res) => {
  const { id } = req.params;
  const userId = req.auth.sub;

  try {
    // Step 1: Update the campaign status to 'assets_generating'.
    const { data: campaign, error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'assets_generating', approved: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select('strategy')
      .single();
    
    if (updateError) {
      return res.status(404).json({ message: 'Campaign not found or you do not have permission to access it.' });
    }

    // Step 2: Trigger the orchestration service to create all the tasks.
    // This happens asynchronously in the background.
    const taskCount = await queueAssetGenerationTasks(id, campaign.strategy);

    res.status(202).json({
      message: 'Asset generation has been successfully queued.',
      task_count: taskCount,
    });
  } catch (error) {
    console.error('Error queuing asset generation:', error);
    res.status(500).json({ message: 'Failed to queue asset generation.', error: error.message });
  }
};

/**
 * Fetches all data for a single campaign, including tasks, assets, and copies.
 * @route GET /api/campaigns/:id
 */
export const getCampaignData = async (req, res) => {
  const { id } = req.params;
  const userId = req.auth.sub;

  try {
    // Fetch the main campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
      
    if (campaignError) {
      return res.status(404).json({ message: 'Campaign not found or you do not have permission to access it.' });
    }

    // Fetch all related data in parallel for efficiency
    const [tasksRes, assetsRes, copiesRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('campaign_id', id),
      supabase.from('assets').select('*').eq('campaign_id', id),
      supabase.from('copies').select('*').eq('campaign_id', id),
    ]);

    if (tasksRes.error || assetsRes.error || copiesRes.error) {
        console.error('Error fetching campaign details:', tasksRes.error || assetsRes.error || copiesRes.error);
        throw new Error('Could not fetch all campaign details.');
    }

    // Combine all data into a single response object
    const fullCampaignData = {
      ...campaign,
      tasks: tasksRes.data || [],
      assets: assetsRes.data || [],
      copies: copiesRes.data || [],
    };

    res.status(200).json(fullCampaignData);
  } catch (error) {
    console.error(`Error fetching data for campaign ${id}:`, error);
    res.status(500).json({ message: 'Failed to fetch campaign data.', error: error.message });
  }
};