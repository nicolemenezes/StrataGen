import 'dotenv/config';

import { GoogleGenAI } from '@google/genai';
import { AppError } from '../utils/AppError.js';

const MODEL_NAME = 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;

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

const generateText = async (prompt) => {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Prompt is required.', 400);
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt.trim(),
    });

    return getResponseText(response);
  } catch (error) {
    handleAiError(error);
  }
};

export const generateCampaign = async (prompt) => {
  return generateText(prompt);
};