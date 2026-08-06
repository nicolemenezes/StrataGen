import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { generateCampaign } from '../services/aiService.js';

export const generateCampaignStrategy = asyncHandler(async (req, res) => {
  const campaignDetails = req.body?.campaignDetails ?? req.body;

  if (!campaignDetails || typeof campaignDetails !== 'object' || Array.isArray(campaignDetails)) {
    throw new AppError('campaignDetails must be provided as an object.', 400);
  }

  const campaignPlan = await generateCampaign(campaignDetails);

  return res.status(200).json(campaignPlan);
});