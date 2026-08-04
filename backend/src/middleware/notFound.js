import { AppError } from '../utils/AppError.js';

export const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};
