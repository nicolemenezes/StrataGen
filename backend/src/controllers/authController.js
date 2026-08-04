import { matchedData, validationResult } from 'express-validator';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { getCurrentUser, loginUser, registerUser } from '../services/authService.js';

const handleValidationErrors = (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new AppError('Validation failed.', 400, errors.array());
  }
};

export const register = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const data = matchedData(req, { locations: ['body'] });
  const result = await registerUser(data);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'User registered successfully.',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  handleValidationErrors(req);
  const data = matchedData(req, { locations: ['body'] });
  const result = await loginUser(data);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Login successful.',
    data: result,
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user._id);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Current user fetched successfully.',
    data: { user },
  });
});
