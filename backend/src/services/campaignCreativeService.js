import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import { AppError } from '../utils/AppError.js';

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const getCampaignByIdForUser = async (campaignId, userId) => {
  if (!mongoose.isValidObjectId(campaignId)) {
    throw new AppError('Invalid campaign id.', 400);
  }

  const campaign = await Campaign.findOne({ _id: campaignId, owner: userId }).populate('owner', 'fullName email profilePicture role');

  if (!campaign) {
    throw new AppError('Campaign not found.', 404);
  }

  return campaign;
};

const normalizeCreative = ({ prompt, platform, contentType }) => {
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

const upsertCreativeApproval = async ({ campaignId, userId, prompt, platform, contentType, status }) => {
  const campaign = await getCampaignByIdForUser(campaignId, userId);
  const creative = normalizeCreative({ prompt, platform, contentType });
  const normalizedStatus = normalizeString(status);

  if (!['accepted', 'rejected'].includes(normalizedStatus)) {
    throw new AppError('status must be accepted or rejected.', 400);
  }

  const approvals = Array.isArray(campaign.imageApprovals) ? [...campaign.imageApprovals] : [];
  const existingIndex = approvals.findIndex(
    (entry) =>
      normalizeString(entry?.prompt) === creative.prompt &&
      normalizeString(entry?.platform) === creative.platform &&
      normalizeString(entry?.contentType) === creative.contentType
  );

  const approvalRecord = {
    ...creative,
    status: normalizedStatus,
    reviewedAt: new Date(),
    reviewedBy: userId,
  };

  if (existingIndex >= 0) {
    approvals[existingIndex] = approvalRecord;
  } else {
    approvals.push(approvalRecord);
  }

  campaign.imageApprovals = approvals;
  await campaign.save();

  return approvalRecord;
};

export const acceptCampaignCreative = async ({ campaignId, userId, prompt, platform, contentType }) =>
  upsertCreativeApproval({
    campaignId,
    userId,
    prompt,
    platform,
    contentType,
    status: 'accepted',
  });

export const rejectCampaignCreative = async ({ campaignId, userId, prompt, platform, contentType }) =>
  upsertCreativeApproval({
    campaignId,
    userId,
    prompt,
    platform,
    contentType,
    status: 'rejected',
  });

export default {
  acceptCampaignCreative,
  rejectCampaignCreative,
};
