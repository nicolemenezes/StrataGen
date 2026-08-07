import {
  buildCampaignPrompt,
  buildContentPrompt,
  buildImagePromptsPrompt,
  buildRefineCampaignPrompt,
  buildStrategyPrompt,
} from './ai/aiPrompts.js';
import { generateGeminiText } from './ai/aiClient.js';
import {
  parseCampaignResponse,
  parseContentResponse,
  parseImagePromptsResponse,
  parseStrategyResponse,
} from './ai/aiParsers.js';

const generateParsedResponse = async (promptBuilder, parser, campaignDetails) => {
  const prompt = promptBuilder(campaignDetails);
  const responseText = await generateGeminiText({
    prompt,
    responseMimeType: 'application/json',
  });

  return parser(responseText);
};

export const generateCampaign = async (campaignDetails) =>
  generateParsedResponse(buildCampaignPrompt, parseCampaignResponse, campaignDetails);

export const generateStrategy = async (campaignDetails) =>
  generateParsedResponse(buildStrategyPrompt, parseStrategyResponse, campaignDetails);

export const generateContent = async (campaignDetails) =>
  generateParsedResponse(buildContentPrompt, parseContentResponse, campaignDetails);

export const generateImagePrompts = async (campaignDetails) =>
  generateParsedResponse(buildImagePromptsPrompt, parseImagePromptsResponse, campaignDetails);

export const refineCampaign = async ({ campaign, instructions }) => {
  const prompt = buildRefineCampaignPrompt(campaign, instructions);
  const responseText = await generateGeminiText({
    prompt,
    responseMimeType: 'application/json',
  });

  return parseCampaignResponse(responseText);
};
