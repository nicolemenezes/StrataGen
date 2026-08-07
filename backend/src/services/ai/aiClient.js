import '../../config/env.js';

import { GoogleGenAI } from '@google/genai';
import { AppError } from '../../utils/AppError.js';

let aiClient;

export const getGeminiApiKey = () => process.env.GEMINI_API_KEY?.trim() || '';

export const getGeminiModel = () => process.env.GEMINI_MODEL?.trim() || '';

const getClient = () => {
  const apiKey = getGeminiApiKey();
  const model = getGeminiModel();

  if (!apiKey) {
    throw new AppError('Gemini API key is not configured in backend/.env. Add GEMINI_API_KEY and restart the backend.', 500);
  }

  if (!model) {
    throw new AppError('Gemini model is not configured in backend/.env. Add GEMINI_MODEL and restart the backend.', 500);
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
};

const normalizeAiError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  const statusCode = Number.isInteger(error?.status)
    ? error.status
    : Number.isInteger(error?.statusCode)
      ? error.statusCode
      : 502;

  const message =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message.trim()
      : 'AI service request failed.';

  return new AppError(statusCode >= 500 ? 'AI service request failed.' : message, statusCode >= 500 ? 502 : statusCode);
};

export const generateGeminiText = async ({ prompt, responseMimeType = 'text/plain' }) => {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Prompt is required.', 400);
  }

  try {
    const response = await getClient().models.generateContent({
      model: getGeminiModel(),
      contents: prompt.trim(),
      config: {
        responseMimeType,
      },
    });

    const text = typeof response?.text === 'string' ? response.text.trim() : '';

    if (!text) {
      throw new AppError('AI service returned an empty response.', 502);
    }

    return text;
  } catch (error) {
    throw normalizeAiError(error);
  }
};
