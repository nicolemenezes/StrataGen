import { matchedData, validationResult } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { getCampaign } from '../services/campaignService.js';
import { generateImage } from '../services/imageService.js';
import { acceptCampaignCreative, rejectCampaignCreative } from '../services/campaignCreativeService.js';

const handleValidationErrors = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError('Validation failed.', 400, errors.array());
  }
};

export const generate = asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const data = matchedData(req, { locations: ['body'] });
  await getCampaign(data.campaignId, req.user._id);
  const prompt = data.imagePrompt?.trim() || data.prompt?.trim();

  const image = await generateImage(prompt);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Image generated successfully.',
    data: {
      campaignId: data.campaignId,
      prompt,
      image: {
        base64: image.base64,
        dataUrl: `data:${image.mimeType};base64,${image.base64}`,
        mimeType: image.mimeType,
        model: image.model,
      },
    },
  });
});

export const regenerate = asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const data = matchedData(req, { locations: ['body'] });
  await getCampaign(data.campaignId, req.user._id);
  const prompt = data.prompt?.trim() || data.imagePrompt?.trim();

  const image = await generateImage(prompt);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Image regenerated successfully.',
    data: {
      campaignId: data.campaignId,
      prompt,
      platform: data.platform,
      contentType: data.contentType,
      image: {
        base64: image.base64,
        dataUrl: `data:${image.mimeType};base64,${image.base64}`,
        mimeType: image.mimeType,
        model: image.model,
      },
    },
  });
});

export const accept = asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const data = matchedData(req, { locations: ['body'] });
  const approval = await acceptCampaignCreative({
    campaignId: data.campaignId,
    userId: req.user._id,
    prompt: data.prompt,
    platform: data.platform,
    contentType: data.contentType,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Creative accepted successfully.',
    data: {
      campaignId: data.campaignId,
      approval,
    },
  });
});

export const reject = asyncHandler(async (req, res) => {
  handleValidationErrors(req);

  const data = matchedData(req, { locations: ['body'] });
  const approval = await rejectCampaignCreative({
    campaignId: data.campaignId,
    userId: req.user._id,
    prompt: data.prompt,
    platform: data.platform,
    contentType: data.contentType,
  });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Creative rejected successfully.',
    data: {
      campaignId: data.campaignId,
      approval,
    },
  });
});
