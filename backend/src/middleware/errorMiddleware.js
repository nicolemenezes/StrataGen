import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  if (Array.isArray(err.errors)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
