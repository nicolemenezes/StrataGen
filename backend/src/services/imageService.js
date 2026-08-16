import '../config/env.js';
import { AppError } from '../utils/AppError.js';

const DEFAULT_MODEL_NAME = 'flux';
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY?.trim();

const getModelName = () => process.env.POLLINATIONS_IMAGE_MODEL?.trim() || DEFAULT_MODEL_NAME;

const validatePrompt = (prompt) => {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Prompt is required to generate an image.', 400);
  }

  return prompt.trim();
};

const getApiKey = () => {
  if (!POLLINATIONS_API_KEY) {
    throw new AppError('Pollinations API key is not configured.', 500);
  }

  return POLLINATIONS_API_KEY;
};

const buildImageUrl = (prompt, modelName) => {
  const encodedPrompt = encodeURIComponent(prompt);
  const encodedModel = encodeURIComponent(modelName);

  return `https://gen.pollinations.ai/image/${encodedPrompt}?model=${encodedModel}`;
};

const logPollinationsRequest = ({ url, model }) => {
  console.info('[Pollinations] Image request');
  console.info('[Pollinations] Request URL:', url);
  console.info('[Pollinations] Model:', model);
};

const logPollinationsResponse = ({ url, model, status, contentType, message }) => {
  console.info('[Pollinations] Image response');
  console.info('[Pollinations] Request URL:', url);
  console.info('[Pollinations] Model:', model);
  console.info('[Pollinations] HTTP status:', status);
  console.info('[Pollinations] Response content-type:', contentType || '');
  console.info('[Pollinations] Response body/error message:', message || '');
};

const extractErrorMessage = (responseBody) => {
  if (typeof responseBody === 'string' && responseBody.trim()) {
    const trimmedBody = responseBody.trim();

    try {
      const parsed = JSON.parse(trimmedBody);

      if (typeof parsed?.error === 'string' && parsed.error.trim()) {
        return parsed.error.trim();
      }

      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }

      if (typeof parsed?.detail === 'string' && parsed.detail.trim()) {
        return parsed.detail.trim();
      }
    } catch (_error) {
      return trimmedBody;
    }

    return trimmedBody;
  }

  if (responseBody && typeof responseBody === 'object') {
    if (typeof responseBody.error === 'string' && responseBody.error.trim()) {
      return responseBody.error.trim();
    }

    if (typeof responseBody.message === 'string' && responseBody.message.trim()) {
      return responseBody.message.trim();
    }

    if (typeof responseBody.detail === 'string' && responseBody.detail.trim()) {
      return responseBody.detail.trim();
    }
  }

  return '';
};

const mapStatusToError = (statusCode, message) => {
  if (statusCode === 401 || statusCode === 403) {
    return new AppError(message || 'Pollinations authentication failed. Check POLLINATIONS_API_KEY permissions.', 401);
  }

  if (statusCode === 429) {
    return new AppError(message || 'Pollinations rate limit exceeded. Please retry shortly.', 429);
  }

  if (statusCode === 404) {
    return new AppError(message || 'The requested Pollinations model could not be found.', 404);
  }

  if (statusCode === 503 || statusCode === 504) {
    return new AppError(message || 'The Pollinations service is temporarily unavailable. Please retry shortly.', statusCode);
  }

  if (statusCode >= 500) {
    return new AppError(message || 'Pollinations image generation failed.', statusCode);
  }

  return new AppError(message || 'Pollinations image generation request failed.', statusCode || 502);
};

const readResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }

  try {
    return await response.text();
  } catch (_error) {
    return '';
  }
};

const ensureBuffer = async (response) => {
  const contentType = response.headers.get('content-type')?.split(';')[0].trim() || 'image/png';

  if (contentType.startsWith('text/') || contentType.includes('json')) {
    const responseBody = await readResponseBody(response);
    const message = extractErrorMessage(responseBody) || 'Pollinations API returned a non-image response.';
    throw new AppError(message, 502);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new AppError('Pollinations API returned an empty image response.', 502);
  }

  return {
    buffer,
    mimeType: contentType,
  };
};

const handlePollinationsError = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const responseBody = await readResponseBody(response);
  const message = extractErrorMessage(responseBody);
  logPollinationsResponse({
    url: response.url,
    model: getModelName(),
    status: response.status,
    contentType,
    message: message || (typeof responseBody === 'string' ? responseBody.trim() : ''),
  });
  throw mapStatusToError(response.status, message || `Pollinations request failed with status ${response.status}.`);
};

export const generateImage = async (prompt) => {
  const normalizedPrompt = validatePrompt(prompt);
  const modelName = getModelName();
  const apiKey = getApiKey();
  const url = buildImageUrl(normalizedPrompt, modelName);

  try {
    logPollinationsRequest({
      url,
      model: modelName,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      await handlePollinationsError(response);
    }

    logPollinationsResponse({
      url: response.url || url,
      model: modelName,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      message: '',
    });

    const { buffer, mimeType } = await ensureBuffer(response);

    return {
      buffer,
      base64: buffer.toString('base64'),
      mimeType,
      model: modelName,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(error?.message || 'Unable to contact Pollinations image generation service.', 502);
  }
};

export default generateImage;
