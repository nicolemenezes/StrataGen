import { matchedData, validationResult } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  saveGeneratedCampaign,
  updateCampaign,
} from '../services/campaignService.js';

const handleValidationErrors = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError('Validation failed.', 400, errors.array());
  }
};

export const create = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const data = matchedData(req, { locations: ['body'] });
  const campaign = await createCampaign(req.user._id, data);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Campaign created successfully.',
    data: { campaign },
  });
});

export const saveGenerated = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const data = req.body;
  const campaign = await saveGeneratedCampaign(req.user._id, data);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Campaign saved successfully.',
    data: { campaign },
  });
});

export const list = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const query = matchedData(req, { locations: ['query'] });
  const result = await listCampaigns(req.user._id, query);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Campaigns fetched successfully.',
    data: result,
  });
});

export const read = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const campaign = await getCampaign(req.params.id, req.user._id);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Campaign fetched successfully.',
    data: { campaign },
  });
});

export const update = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const data = matchedData(req, { locations: ['body'] });
  const campaign = await updateCampaign(req.params.id, req.user._id, data);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Campaign updated successfully.',
    data: { campaign },
  });
});

export const remove = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const result = await deleteCampaign(req.params.id, req.user._id);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Campaign deleted successfully.',
    data: result,
  });
});
