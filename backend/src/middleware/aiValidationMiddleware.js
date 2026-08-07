import { AppError } from '../utils/AppError.js';

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const validateAiRequest = (req, _res, next) => {
  const campaignDetails = req.body?.campaignDetails ?? req.body;

  if (!isPlainObject(campaignDetails) || Object.keys(campaignDetails).length === 0) {
    throw new AppError('Request body must be a non-empty object.', 400);
  }

  req.aiInput = campaignDetails;
  next();
};
