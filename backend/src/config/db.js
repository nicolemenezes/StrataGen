import mongoose from 'mongoose';
import User from '../models/User.js';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined.');
  }

  await mongoose.connect(mongoUri);
  await User.syncIndexes();
  console.log('MongoDB connected.');
};
