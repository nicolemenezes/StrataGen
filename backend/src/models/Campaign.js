import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required.'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required.'],
      trim: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
    },
    targetAudience: {
      type: String,
      required: [true, 'Target audience is required.'],
      trim: true,
    },
    campaignGoal: {
      type: String,
      required: [true, 'Campaign goal is required.'],
      trim: true,
    },
    platforms: {
      type: [String],
      required: [true, 'At least one platform is required.'],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one platform is required.',
      },
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required.'],
      min: [0, 'Budget must be zero or greater.'],
    },
    status: {
      type: String,
      enum: ['Draft', 'Generating', 'Ready', 'Scheduled', 'Published'],
      default: 'Draft',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Campaign owner is required.'],
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ title: 'text', companyName: 'text' });

export default mongoose.model('Campaign', campaignSchema);
