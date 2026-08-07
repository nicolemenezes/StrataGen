import { AppError } from '../../utils/AppError.js';

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

const parseJson = (text) => {
  const parsedText = extractJsonText(text);

  try {
    return JSON.parse(parsedText);
  } catch (_error) {
    throw new AppError('AI response did not contain valid JSON.', 502);
  }
};

const ensureObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('AI response did not contain a valid campaign object.', 502);
  }

  return value;
};

export const parseCampaignResponse = (text) => {
  const parsedValue = ensureObject(parseJson(text));

  return {
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
};

export const parseStrategyResponse = (text) => {
  const parsedValue = ensureObject(parseJson(text));

  return {
    strategyName: normalizeString(parsedValue.strategyName, 'strategyName'),
    strategySummary: normalizeString(parsedValue.strategySummary, 'strategySummary'),
    targetAudience: normalizeString(parsedValue.targetAudience, 'targetAudience'),
    keyMessages: normalizeStringArray(parsedValue.keyMessages, 'keyMessages'),
    channelFocus: normalizeStringArray(parsedValue.channelFocus, 'channelFocus'),
    priorities: normalizeStringArray(parsedValue.priorities, 'priorities'),
    nextSteps: normalizeStringArray(parsedValue.nextSteps, 'nextSteps'),
  };
};

export const parseContentResponse = (text) => {
  const parsedValue = ensureObject(parseJson(text));

  return {
    contentTheme: normalizeString(parsedValue.contentTheme, 'contentTheme'),
    contentIdeas: normalizeStringArray(parsedValue.contentIdeas, 'contentIdeas'),
    captions: normalizeStringArray(parsedValue.captions, 'captions'),
    hashtags: normalizeStringArray(parsedValue.hashtags, 'hashtags'),
    callToActions: normalizeStringArray(parsedValue.callToActions, 'callToActions'),
  };
};

export const parseImagePromptsResponse = (text) => {
  const parsedValue = ensureObject(parseJson(text));

  return {
    imagePrompts: normalizeStringArray(parsedValue.imagePrompts, 'imagePrompts'),
  };
};
