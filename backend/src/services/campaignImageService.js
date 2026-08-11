import crypto from 'crypto';
import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import { AppError } from '../utils/AppError.js';
import { uploadImage } from './cloudinaryService.js';

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const getCampaignByIdForUser = async (campaignId, userId) => {
  if (!mongoose.isValidObjectId(campaignId)) {
    throw new AppError('Invalid campaign id.', 400);
  }

  const campaign = await Campaign.findOne({ _id: campaignId, owner: userId });

  if (!campaign) {
    throw new AppError('Campaign not found.', 404);
  }

  return campaign;
};

const parseDataUrl = (dataUrl) => {
  const normalizedDataUrl = normalizeString(dataUrl);

  if (!normalizedDataUrl) {
    throw new AppError('imageDataUrl is required.', 400);
  }

  const match = normalizedDataUrl.match(/^data:([^;]+);base64,(.+)$/i);

  if (!match) {
    throw new AppError('imageDataUrl must be a valid base64 data URL.', 400);
  }

  const mimeType = normalizeString(match[1]) || 'image/png';
  const base64 = normalizeString(match[2]);

  if (!base64) {
    throw new AppError('imageDataUrl does not contain image data.', 400);
  }

  const buffer = Buffer.from(base64, 'base64');

  if (!buffer.length) {
    throw new AppError('imageDataUrl could not be decoded.', 400);
  }

  return {
    buffer,
    mimeType,
  };
};

const buildSourceHash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const ensureImageMetadata = ({ prompt, platform, contentType }) => {
  const normalizedPrompt = normalizeString(prompt);
  const normalizedPlatform = normalizeString(platform);
  const normalizedContentType = normalizeString(contentType);

  if (!normalizedPrompt) {
    throw new AppError('prompt is required.', 400);
  }

  if (!normalizedPlatform) {
    throw new AppError('platform is required.', 400);
  }

  if (!normalizedContentType) {
    throw new AppError('contentType is required.', 400);
  }

  return {
    prompt: normalizedPrompt,
    platform: normalizedPlatform,
    contentType: normalizedContentType,
  };
};

export const acceptCampaignImage = async ({ campaignId, userId, prompt, platform, contentType, imageDataUrl }) => {
  const campaign = await getCampaignByIdForUser(campaignId, userId);
  const metadata = ensureImageMetadata({ prompt, platform, contentType });
  const { buffer, mimeType } = parseDataUrl(imageDataUrl);
  const sourceHash = buildSourceHash(buffer);

  const alreadyAccepted = Array.isArray(campaign.images)
    ? campaign.images.some((image) => image?.sourceHash === sourceHash && image?.status === 'accepted')
    : false;

  if (alreadyAccepted) {
    throw new AppError('This image has already been accepted.', 409);
  }

  const uploadedImage = await uploadImage(buffer);

  const imageRecord = {
    secure_url: uploadedImage.secure_url,
    publicId: uploadedImage.public_id,
    platform: metadata.platform,
    contentType: metadata.contentType,
    prompt: metadata.prompt,
    status: 'accepted',
    sourceHash,
    mimeType: uploadedImage.mimeType || mimeType,
  };

  campaign.images.push(imageRecord);
  await campaign.save();

  return imageRecord;
};

export default {
  acceptCampaignImage,
};
