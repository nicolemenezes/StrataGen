import '../config/env.js';

import {
  InferenceClient,
  InferenceClientError,
  InferenceClientHubApiError,
  InferenceClientProviderApiError,
  InferenceClientProviderOutputError,
  InferenceClientRoutingError,
} from '@huggingface/inference';
import { AppError } from '../utils/AppError.js';

const DEFAULT_MODEL_NAME = 'black-forest-labs/FLUX.1-dev';
const HF_API_KEY = process.env.HF_API_KEY?.trim();

console.info('[Hugging Face] API key configured:', Boolean(HF_API_KEY));

let inferenceClient = null;

const getModelName = () => process.env.HF_IMAGE_MODEL?.trim() || DEFAULT_MODEL_NAME;

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

const getInferenceClient = () => {
  if (!inferenceClient) {
    inferenceClient = new InferenceClient(getApiKey());
  }

  return inferenceClient;
};

const toDebugBody = (body) => {
  if (typeof body === 'string') {
    return body;
  }

  if (body === undefined || body === null) {
    return '';
  }

  try {
    return JSON.stringify(body, null, 2);
  } catch (_error) {
    return String(body);
  }
};

const logHuggingFaceError = (error) => {
  const requestUrl = error?.httpRequest?.url || error?.request?.url || 'unknown';
  const requestMethod = error?.httpRequest?.method || error?.request?.method || 'POST';
  const statusCode = error?.httpResponse?.status || error?.response?.status || 0;
  const requestId = error?.httpResponse?.requestId || error?.response?.requestId || '';
  const responseBody = error?.httpResponse?.body ?? error?.response?.body ?? error?.body ?? '';

  console.error('[Hugging Face] Image generation failed.');
  console.error('[Hugging Face] Request:', `${requestMethod} ${requestUrl}`);
  console.error('[Hugging Face] Status:', statusCode || 'unknown');
  if (requestId) {
    console.error('[Hugging Face] Request ID:', requestId);
  }
  console.error('[Hugging Face] Response body:', toDebugBody(responseBody));
};

const mapStatusToError = (statusCode, message) => {
  if (statusCode === 401 || statusCode === 403) {
    return new AppError(message || 'Hugging Face authentication failed. Check HF_API_KEY permissions.', 401);
  }

  if (statusCode === 429) {
    return new AppError(message || 'Hugging Face rate limit exceeded. Please retry shortly.', 429);
  }

  if (statusCode === 404) {
    return new AppError(message || 'The requested Hugging Face model or provider could not be found.', 404);
  }

  if (statusCode === 503 || statusCode === 504) {
    return new AppError(message || 'The Hugging Face model is loading or temporarily unavailable. Please retry shortly.', 503);
  }

  if (statusCode >= 500) {
    return new AppError(message || 'Hugging Face image generation failed.', 502);
  }

  return new AppError(message || 'Hugging Face image generation request failed.', statusCode || 502);
};

const extractErrorMessage = (error) => {
  const responseBody = error?.httpResponse?.body ?? error?.response?.body ?? error?.body ?? null;

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody.trim();
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

    if (typeof responseBody.estimated_time === 'number' && Number.isFinite(responseBody.estimated_time)) {
      return `The Hugging Face model is still loading. Retry in about ${Math.ceil(responseBody.estimated_time)} seconds.`;
    }
  }

  return '';
};

const ensureBuffer = async (output) => {
  if (output instanceof Blob) {
    const arrayBuffer = await output.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!buffer.length) {
      throw new AppError('Hugging Face API returned an empty image response.', 502);
    }

    return {
      buffer,
      mimeType: output.type || 'image/png',
    };
  }

  if (typeof output === 'string') {
    const trimmedOutput = output.trim();

    if (!trimmedOutput) {
      throw new AppError('Hugging Face API returned an empty image response.', 502);
    }

    if (trimmedOutput.startsWith('data:')) {
      const base64Content = trimmedOutput.split(',')[1] || '';
      const buffer = Buffer.from(base64Content, 'base64');

      if (!buffer.length) {
        throw new AppError('Hugging Face API returned an empty image response.', 502);
      }

      return {
        buffer,
        mimeType: 'image/png',
      };
    }

    return {
      buffer: Buffer.from(trimmedOutput, 'base64'),
      mimeType: 'image/png',
    };
  }

  if (output instanceof ArrayBuffer) {
    const buffer = Buffer.from(output);

    if (!buffer.length) {
      throw new AppError('Hugging Face API returned an empty image response.', 502);
    }

    return {
      buffer,
      mimeType: 'image/png',
    };
  }

  throw new AppError('Hugging Face API returned an unsupported image response.', 502);
};

const handleInferenceError = (error) => {
  if (error instanceof InferenceClientProviderApiError || error instanceof InferenceClientHubApiError) {
    logHuggingFaceError(error);

    const statusCode = error.httpResponse?.status || 502;
    const message = extractErrorMessage(error) || error.message || 'Hugging Face image generation failed.';
    throw mapStatusToError(statusCode, message);
  }

  if (error instanceof InferenceClientRoutingError) {
    logHuggingFaceError(error);
    throw new AppError(error.message || 'Hugging Face routing failed for the requested image model.', 502);
  }

  if (error instanceof InferenceClientProviderOutputError) {
    logHuggingFaceError(error);
    throw new AppError(error.message || 'Hugging Face provider returned an invalid image response.', 502);
  }

  if (error instanceof InferenceClientError) {
    logHuggingFaceError(error);
    throw new AppError(error.message || 'Hugging Face image generation failed.', 502);
  }

  throw new AppError(error?.message || 'Unable to contact Hugging Face Inference Providers.', 502);
};

export const generateImage = async (prompt) => {
  const normalizedPrompt = validatePrompt(prompt);
  const modelName = getModelName();
  const client = getInferenceClient();

  try {
    const image = await client.textToImage(
      {
        model: modelName,
        inputs: normalizedPrompt,
      },
      {
        outputType: 'blob',
      }
    );

    const { buffer, mimeType } = await ensureBuffer(image);

    return {
      buffer,
      base64: buffer.toString('base64'),
      mimeType,
      model: modelName,
    };
  } catch (error) {
    handleInferenceError(error);
  }
};

export default generateImage;
