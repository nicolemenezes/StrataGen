import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import { AppError } from '../utils/AppError.js';

const buildCampaignQuery = (userId, search) => {
  const query = { owner: userId };

  if (search && search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { companyName: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  return query;
};

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

export const createCampaign = async (userId, payload) => {
  const campaign = await Campaign.create({
    ...payload,
    owner: userId,
  });

  return Campaign.findById(campaign._id).populate('owner', 'fullName email profilePicture role');
};

export const listCampaigns = async (userId, { page = 1, limit = 10, search = '' }) => {
  const filter = buildCampaignQuery(userId, search);
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    Campaign.find(filter)
      .populate('owner', 'fullName email profilePicture role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Campaign.countDocuments(filter),
  ]);

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCampaign = async (campaignId, userId) => {
  return getCampaignByIdForUser(campaignId, userId);
};

export const updateCampaign = async (campaignId, userId, payload) => {
  const campaign = await getCampaignByIdForUser(campaignId, userId);

  Object.assign(campaign, payload);
  await campaign.save();

  return Campaign.findById(campaign._id).populate('owner', 'fullName email profilePicture role');
};

export const deleteCampaign = async (campaignId, userId) => {
  const campaign = await getCampaignByIdForUser(campaignId, userId);
  await campaign.deleteOne();

  return { deletedCampaignId: campaignId };
};
