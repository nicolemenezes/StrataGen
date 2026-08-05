import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { generateCampaign } from '../services/aiService.js';

const buildCampaignPrompt = (campaignDetails) => {
  const details = campaignDetails && typeof campaignDetails === 'object' ? campaignDetails : {};
  const promptLines = ['Create a concise campaign strategy using the following details:'];

  const fields = [
    ['Title', details.title],
    ['Company Name', details.companyName],
    ['Industry', details.industry],
    ['Description', details.description],
    ['Target Audience', details.targetAudience],
    ['Campaign Goal', details.campaignGoal],
    ['Budget', details.budget],
    ['Platforms', Array.isArray(details.platforms) ? details.platforms.join(', ') : details.platforms],
    ['Tone', details.tone],
    ['Key Message', details.keyMessage],
    ['CTA', details.cta],
  ];

  fields.forEach(([label, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      promptLines.push(`${label}: ${Array.isArray(value) ? value.join(', ') : value}`);
    }
  });

  promptLines.push('Return only the campaign strategy text.');

  return promptLines.join('\n');
};

export const generateCampaignStrategy = asyncHandler(async (req, res) => {
  const campaignDetails = req.body?.campaignDetails ?? req.body;

  if (!campaignDetails || typeof campaignDetails !== 'object' || Array.isArray(campaignDetails)) {
    throw new AppError('campaignDetails must be provided as an object.', 400);
  }

  const prompt = buildCampaignPrompt(campaignDetails);
  const result = await generateCampaign(prompt);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Campaign strategy generated successfully.',
    data: { result },
  });
});