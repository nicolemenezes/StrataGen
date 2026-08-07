import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import {
  generateCampaign as generateCampaignService,
  generateContent as generateContentService,
  generateImagePrompts as generateImagePromptsService,
  generateStrategy as generateStrategyService,
  refineCampaign as refineCampaignService,
} from '../services/aiService.js';
import { saveGeneratedCampaign } from '../services/campaignService.js';

export const generateCampaignStrategy = asyncHandler(async (req, res) => {
  const campaignPlan = await generateCampaignService(req.aiInput);
  const campaign = await saveGeneratedCampaign(req.user._id, {
    campaignDetails: req.aiInput,
    campaignPlan,
    sourcePrompt: req.body?.campaignDetails?.description || req.body?.description || '',
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Campaign generated successfully.',
    data: { campaign, campaignPlan },
  });
});

export const generateStrategy = asyncHandler(async (req, res) => {
  const strategy = await generateStrategyService(req.aiInput);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Strategy generated successfully.',
    data: { strategy },
  });
});

export const generateContent = asyncHandler(async (req, res) => {
  const content = await generateContentService(req.aiInput);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Content generated successfully.',
    data: { content },
  });
});

export const generateImagePrompts = asyncHandler(async (req, res) => {
  const imagePrompts = await generateImagePromptsService(req.aiInput);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Image prompts generated successfully.',
    data: { imagePrompts },
  });
});

export const refineCampaign = asyncHandler(async (req, res) => {
  const campaign = req.aiInput?.campaign;
  const instructions = req.aiInput?.instructions;

  if (!campaign || typeof campaign !== 'object' || Array.isArray(campaign)) {
    throw new AppError('campaign must be provided as an object.', 400);
  }

  if (typeof instructions !== 'string' || !instructions.trim()) {
    throw new AppError('instructions are required.', 400);
  }

  const campaignPlan = await refineCampaignService({
    campaign,
    instructions: instructions.trim(),
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Campaign refined successfully.',
    data: { campaignPlan },
  });
});
