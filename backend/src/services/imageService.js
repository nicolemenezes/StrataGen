import '../config/env.js';

import { AppError } from '../utils/AppError.js';

const HF_API_BASE_URL = 'https://api-inference.huggingface.co/models';
const DEFAULT_MODEL_NAME = 'stabilityai/stable-diffusion-xl-base-1.0';
const HF_API_KEY = process.env.HF_API_KEY;

const getModelName = () => process.env.HF_IMAGE_MODEL || DEFAULT_MODEL_NAME;

const getInferenceUrl = (modelName) => `${HF_API_BASE_URL}/${encodeURIComponent(modelName)}`;

const validatePrompt = (prompt) => {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Prompt is required to generate an image.', 400);
  }

  return prompt.trim();
};

const getApiKey = () => {
  if (!HF_API_KEY) {
    throw new AppError('Hugging Face API key is not configured.', 500);
  }

  return HF_API_KEY;
};

const buildRequestBody = (prompt) => ({
  inputs: prompt,
  options: {
    wait_for_model: true,
  },
});

const safeParseJson = async (response) => {
  try {
    return await response.clone().json();
  } catch (_error) {
    return null;
  }
};

const parseErrorMessage = async (response) => {
  const payload = await safeParseJson(response);

  if (typeof payload?.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  const fallbackText = await response.clone().text().catch(() => '');

  if (fallbackText.trim()) {
    return fallbackText.trim();
  }

  return 'Image generation request failed.';
};

const mapStatusToError = (statusCode, message) => {
  if (statusCode === 429) {
    return new AppError(message || 'Hugging Face API rate limit exceeded.', 429);
  }

  if (statusCode === 503) {
    return new AppError(message || 'The Hugging Face model is loading. Please retry shortly.', 503);
  }

  if (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 404 || statusCode === 422) {
    return new AppError(message || 'Hugging Face image generation request was rejected.', statusCode);
  }

  return new AppError(message || 'Hugging Face image generation failed.', statusCode >= 500 ? 502 : statusCode);
};

const ensureImageResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('image/')) {
    const errorMessage = await parseErrorMessage(response);
    throw new AppError(errorMessage || 'Hugging Face API returned an invalid image response.', 502);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new AppError('Hugging Face API returned an empty image response.', 502);
  }

  return {
    buffer,
    base64: buffer.toString('base64'),
    mimeType: contentType.split(';')[0].trim() || 'image/png',
    model: getModelName(),
  };
};

const handleFetchFailure = (error) => {
  if (error instanceof AppError) {
    throw error;
  }

  throw new AppError(error?.message || 'Unable to contact the Hugging Face image service.', 502);
};

export const generateImage = async (prompt) => {
  const normalizedPrompt = validatePrompt(prompt);
  const modelName = getModelName();
  const apiKey = getApiKey();
  const url = getInferenceUrl(modelName);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'image/*',
      },
      body: JSON.stringify(buildRequestBody(normalizedPrompt)),
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw mapStatusToError(response.status, message);
    }

    return ensureImageResponse(response);
  } catch (error) {
    handleFetchFailure(error);
  }
};

export default generateImage;
