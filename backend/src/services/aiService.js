import 'dotenv/config';

import { GoogleGenAI } from '@google/genai';
import { AppError } from '../utils/AppError.js';

const MODEL_NAME = 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;

const CAMPAIGN_OUTPUT_FIELDS = [
  'campaignName',
  'campaignSummary',
  'targetAudience',
  'marketingGoals',
  'brandTone',
  'contentCalendar',
  'captions',
  'hashtags',
  'imagePrompts',
];

let aiClient;

const getAiClient = () => {
  if (!API_KEY) {
    throw new AppError('Gemini API key is not configured.', 500);
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }

  return aiClient;
};

const getResponseText = (response) => {
  const text = response?.text?.trim();

  if (!text) {
    throw new AppError('AI service returned an empty response.', 502);
  }

  return text;
};

const handleAiError = (error) => {
  if (error instanceof AppError) {
    throw error;
  }

  const statusCode = Number.isInteger(error?.status) ? error.status : 502;
  const message = statusCode >= 500 ? 'AI service request failed.' : error?.message || 'AI service request failed.';

  throw new AppError(message, statusCode >= 500 ? 502 : statusCode);
};

const stringifyValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .join(', ');
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
};

const buildCampaignPrompt = (campaignDetails) => {
  const details = campaignDetails && typeof campaignDetails === 'object' && !Array.isArray(campaignDetails) ? campaignDetails : {};

  const promptLines = [
    'You are a senior marketing strategist.',
    'Create a campaign plan based on the provided details.',
    'Return a single JSON object only. Do not wrap the response in markdown, code fences, or commentary.',
    'Use these exact top-level keys: campaignName, campaignSummary, targetAudience, marketingGoals, brandTone, contentCalendar, captions, hashtags, imagePrompts.',
    'Value requirements:',
    '- campaignName: string',
    '- campaignSummary: string',
    '- targetAudience: string',
    '- marketingGoals: array of strings',
    '- brandTone: string',
    '- contentCalendar: array of objects with day, platform, contentType, focus, and goal',
    '- captions: array of objects with platform, contentType, and caption',
    '- hashtags: array of strings',
    '- imagePrompts: array of strings',
    'If a detail is missing, infer it reasonably from context instead of inventing conflicting facts.',
    'Campaign details:',
  ];

  const fields = [
    ['Title', details.title],
    ['Company Name', details.companyName],
    ['Industry', details.industry],
    ['Description', details.description],
    ['Target Audience', details.targetAudience],
    ['Campaign Goal', details.campaignGoal],
    ['Budget', details.budget],
    ['Platforms', details.platforms],
    ['Tone', details.tone],
    ['Key Message', details.keyMessage],
    ['CTA', details.cta],
    ['Duration', details.duration],
    ['Brand Values', details.brandValues],
    ['Competitors', details.competitors],
    ['Additional Notes', details.additionalNotes],
  ];

  fields.forEach(([label, value]) => {
    const normalizedValue = stringifyValue(value);

    if (normalizedValue) {
      promptLines.push(`${label}: ${normalizedValue}`);
    }
  });

  promptLines.push('Remember: output valid JSON only.');

  return promptLines.join('\n');
};

const stripMarkdownFences = (text) => text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

const extractJsonText = (text) => {
  const cleanedText = stripMarkdownFences(text);

  if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
    return cleanedText;
  }

  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return cleanedText.slice(firstBrace, lastBrace + 1);
  }

  throw new AppError('AI response did not contain valid JSON.', 502);
};

const normalizeString = (value, fieldName) => {
  if (typeof value !== 'string') {
    throw new AppError(`AI response is missing a valid ${fieldName}.`, 502);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new AppError(`AI response is missing a valid ${fieldName}.`, 502);
  }

  return normalizedValue;
};

const normalizeStringArray = (value, fieldName) => {
  if (typeof value === 'string') {
    const normalizedValue = value.trim();
    return normalizedValue ? [normalizedValue] : [];
  }

  if (!Array.isArray(value)) {
    throw new AppError(`AI response is missing a valid ${fieldName}.`, 502);
  }

  const normalizedValues = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  if (!normalizedValues.length) {
    throw new AppError(`AI response is missing a valid ${fieldName}.`, 502);
  }

  return normalizedValues;
};

const normalizeObjectArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new AppError(`AI response is missing a valid ${fieldName}.`, 502);
  }

  const normalizedValues = value.filter((item) => item && typeof item === 'object' && !Array.isArray(item));

  if (!normalizedValues.length) {
    throw new AppError(`AI response is missing a valid ${fieldName}.`, 502);
  }

  return normalizedValues;
};

const parseCampaignJson = (text) => {
  const parsedText = extractJsonText(text);

  let parsedValue;

  try {
    parsedValue = JSON.parse(parsedText);
  } catch (_error) {
    throw new AppError('AI response did not contain valid JSON.', 502);
  }

  if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
    throw new AppError('AI response did not contain a valid campaign object.', 502);
  }

  const output = {
    campaignName: normalizeString(parsedValue.campaignName, 'campaignName'),
    campaignSummary: normalizeString(parsedValue.campaignSummary, 'campaignSummary'),
    targetAudience: normalizeString(parsedValue.targetAudience, 'targetAudience'),
    marketingGoals: normalizeStringArray(parsedValue.marketingGoals, 'marketingGoals'),
    brandTone: normalizeString(parsedValue.brandTone, 'brandTone'),
    contentCalendar: normalizeObjectArray(parsedValue.contentCalendar, 'contentCalendar'),
    captions: normalizeObjectArray(parsedValue.captions, 'captions'),
    hashtags: normalizeStringArray(parsedValue.hashtags, 'hashtags'),
    imagePrompts: normalizeStringArray(parsedValue.imagePrompts, 'imagePrompts'),
  };

  CAMPAIGN_OUTPUT_FIELDS.forEach((fieldName) => {
    if (!(fieldName in output)) {
      throw new AppError('AI response did not contain a valid campaign object.', 502);
    }
  });

  return output;
};

const generateText = async (prompt) => {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Prompt is required.', 400);
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt.trim(),
      config: {
        responseMimeType: 'application/json',
      },
    });

    return getResponseText(response);
  } catch (error) {
    handleAiError(error);
  }
};

export const generateCampaign = async (campaignDetails) => {
  const prompt = buildCampaignPrompt(campaignDetails);
  const responseText = await generateText(prompt);

  return parseCampaignJson(responseText);
};