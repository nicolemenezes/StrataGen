import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Not authorized. Missing Bearer token.', 401);
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT secret is not configured.', 500);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    throw new AppError('Not authorized. Invalid or expired token.', 401);
  }

  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw new AppError('Not authorized. User not found.', 401);
  }

  req.user = user;
  next();
});
