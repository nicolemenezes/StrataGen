import mongoose from 'mongoose';

const socialAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required.'],
      index: true,
    },
    platform: {
      type: String,
      enum: ['instagram'],
      required: [true, 'Platform is required.'],
      trim: true,
    },
    instagramAccountId: {
      type: String,
      required: [true, 'Instagram account ID is required.'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Instagram username is required.'],
      trim: true,
    },
    accessToken: {
      type: String,
      required: [true, 'Access token is required.'],
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
      default: null,
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected'],
      default: 'connected',
    },
    pageId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

socialAccountSchema.index({ user: 1, platform: 1 }, { unique: true });

socialAccountSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.accessToken;
    return ret;
  },
});

socialAccountSchema.set('toObject', {
  transform: (_doc, ret) => {
    delete ret.accessToken;
    return ret;
  },
});

export default mongoose.model('SocialAccount', socialAccountSchema);
