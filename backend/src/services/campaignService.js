import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import { AppError } from '../utils/AppError.js';

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeString = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalizedValue = value.trim();

  return normalizedValue || fallback;
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim();
    return normalizedValue ? [normalizedValue] : [];
  }

  return [];
};

const normalizeObjectArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
};

const getCampaignPlan = (payload) => {
  if (isPlainObject(payload?.campaignPlan)) {
    return payload.campaignPlan;
  }

  if (isPlainObject(payload?.generatedCampaign)) {
    return payload.generatedCampaign;
  }

  return {};
};

const getSourceDetails = (payload) => {
  if (isPlainObject(payload?.campaignDetails)) {
    return payload.campaignDetails;
  }

  if (isPlainObject(payload?.sourceDetails)) {
    return payload.sourceDetails;
  }

  return isPlainObject(payload) ? payload : {};
};

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

export const saveGeneratedCampaign = async (userId, payload) => {
  const campaignPlan = getCampaignPlan(payload);
  const sourceDetails = getSourceDetails(payload);

  const title = normalizeString(payload?.title, normalizeString(campaignPlan.campaignName, 'New Campaign'));
  const companyName = normalizeString(
    payload?.companyName,
    normalizeString(sourceDetails.companyName, normalizeString(sourceDetails.title, normalizeString(title, 'Unknown Company')))
  );
  const industry = normalizeString(payload?.industry, normalizeString(sourceDetails.industry, 'General'));
  const description = normalizeString(
    payload?.description,
    normalizeString(sourceDetails.description, normalizeString(campaignPlan.campaignSummary, normalizeString(payload?.sourcePrompt, 'Generated campaign')))
  );
  const targetAudience = normalizeString(
    payload?.targetAudience,
    normalizeString(sourceDetails.targetAudience, normalizeString(campaignPlan.targetAudience, 'General audience'))
  );
  const campaignGoal = normalizeString(
    payload?.campaignGoal,
    normalizeString(sourceDetails.campaignGoal, normalizeString(campaignPlan.campaignSummary, 'Generate awareness'))
  );
  const payloadPlatforms = normalizeStringArray(payload?.platforms);
  const sourcePlatforms = normalizeStringArray(sourceDetails.platforms);
  const platforms = payloadPlatforms.length ? payloadPlatforms : sourcePlatforms.length ? sourcePlatforms : ['General'];
  const numericBudget = Number(payload?.budget ?? sourceDetails.budget ?? 0);
  const budgetValue = Number.isFinite(numericBudget) ? numericBudget : 0;

  const aiOutput = {
    ...campaignPlan,
    sourceDetails,
    generationModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    generatedAt: new Date().toISOString(),
  };

  const campaign = await Campaign.create({
    title,
    companyName,
    industry,
    description,
    targetAudience,
    campaignGoal,
    platforms,
    budget: budgetValue,
    status: payload?.status || 'Ready',
    sourcePrompt: normalizeString(payload?.sourcePrompt, normalizeString(sourceDetails.description, '')),
    aiOutput,
    owner: userId,
  });

  return Campaign.findById(campaign._id).populate('owner', 'fullName email profilePicture role');
};

export const listCampaigns = async (userId, { page = 1, limit, search = '' }) => {
  const filter = buildCampaignQuery(userId, search);
  const total = await Campaign.countDocuments(filter);
  const query = Campaign.find(filter)
    .populate('owner', 'fullName email profilePicture role')
    .sort({ createdAt: -1 });

  if (Number.isInteger(limit) && limit > 0) {
    const skip = (page - 1) * limit;
    query.skip(skip).limit(limit);
  }

  const campaigns = await query;

  return {
    campaigns,
    pagination: {
      page,
      limit: Number.isInteger(limit) && limit > 0 ? limit : total,
      total,
      totalPages: Number.isInteger(limit) && limit > 0 ? Math.ceil(total / limit) || 1 : 1,
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
