import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT secret is not configured.', 500);
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const buildAuthResponse = (user, token) => ({
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePicture: user.profilePicture,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  },
  token,
});

export const registerUser = async ({ fullName, email, password, profilePicture = null }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('A user with this email already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    profilePicture,
  });

  const token = createToken(user._id.toString());
  return buildAuthResponse(user, token);
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = createToken(user._id.toString());
  const publicUser = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePicture: user.profilePicture,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return buildAuthResponse(publicUser, token);
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
};
