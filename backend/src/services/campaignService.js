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

const normalizeImagePromptStrings = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (item && typeof item === 'object' && !Array.isArray(item) && typeof item.prompt === 'string') {
        return item.prompt.trim();
      }

      return '';
    })
    .filter(Boolean);
};

const normalizeImagePromptObjects = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (typeof item === 'string') {
        const prompt = item.trim();

        if (!prompt) {
          return null;
        }

        return {
          platform: `Prompt ${index + 1}`,
          contentType: 'image',
          prompt,
        };
      }

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const prompt = normalizeString(item.prompt, '');

      if (!prompt) {
        return null;
      }

      return {
        platform: normalizeString(item.platform, `Prompt ${index + 1}`),
        contentType: normalizeString(item.contentType, 'image'),
        prompt,
      };
    })
    .filter(Boolean);
};

const hasItems = (value) => Array.isArray(value) && value.length > 0;

const getCampaignContentSource = (payload) => {
  const source = isPlainObject(payload) ? { ...payload } : {};

  if (isPlainObject(payload?.campaignPlan)) {
    Object.assign(source, payload.campaignPlan);
  }

  if (isPlainObject(payload?.generatedCampaign)) {
    Object.assign(source, payload.generatedCampaign);
  }

  if (isPlainObject(payload?.aiOutput)) {
    Object.assign(source, payload.aiOutput);
  }

  return source;
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

const normalizeCampaignFields = (payload, fallback = {}) => {
  const source = getCampaignContentSource(payload);
  const fallbackSource = isPlainObject(fallback) ? fallback : {};

  const title = normalizeString(
    payload?.title,
    normalizeString(fallbackSource.title, normalizeString(source.campaignName, 'New Campaign'))
  );
  const campaignSummary = normalizeString(
    payload?.campaignSummary,
    normalizeString(
      fallbackSource.campaignSummary,
      normalizeString(source.campaignSummary, normalizeString(payload?.description, normalizeString(fallbackSource.description, '')))
    )
  );
  const targetAudience = normalizeString(
    payload?.targetAudience,
    normalizeString(fallbackSource.targetAudience, normalizeString(source.targetAudience, 'General audience'))
  );
  const brandTone = normalizeString(payload?.brandTone, normalizeString(fallbackSource.brandTone, normalizeString(source.brandTone, '')));
  const marketingGoals = normalizeStringArray(payload?.marketingGoals).length
    ? normalizeStringArray(payload?.marketingGoals)
    : normalizeStringArray(fallbackSource.marketingGoals).length
      ? normalizeStringArray(fallbackSource.marketingGoals)
      : normalizeStringArray(source.marketingGoals);
  const contentCalendar = normalizeObjectArray(payload?.contentCalendar).length
    ? normalizeObjectArray(payload?.contentCalendar)
    : normalizeObjectArray(fallbackSource.contentCalendar).length
      ? normalizeObjectArray(fallbackSource.contentCalendar)
      : normalizeObjectArray(source.contentCalendar);
  const captions = normalizeObjectArray(payload?.captions).length
    ? normalizeObjectArray(payload?.captions)
    : normalizeObjectArray(fallbackSource.captions).length
      ? normalizeObjectArray(fallbackSource.captions)
      : normalizeObjectArray(source.captions);
  const hashtags = normalizeStringArray(payload?.hashtags).length
    ? normalizeStringArray(payload?.hashtags)
    : normalizeStringArray(fallbackSource.hashtags).length
      ? normalizeStringArray(fallbackSource.hashtags)
      : normalizeStringArray(source.hashtags);
  const imagePrompts = normalizeImagePromptStrings(payload?.imagePrompts).length
    ? normalizeImagePromptStrings(payload?.imagePrompts)
    : normalizeImagePromptStrings(fallbackSource.imagePrompts).length
      ? normalizeImagePromptStrings(fallbackSource.imagePrompts)
      : normalizeImagePromptStrings(source.imagePrompts);

  return {
    title,
    campaignSummary,
    targetAudience,
    brandTone,
    marketingGoals,
    contentCalendar,
    captions,
    hashtags,
    imagePrompts,
  };
};

const buildLegacyAiOutput = (campaignFields, extra = {}) => {
  const { imagePrompts: extraImagePrompts, ...rest } = extra;
  const resolvedImagePrompts = hasItems(extraImagePrompts) ? extraImagePrompts : campaignFields.imagePrompts;

  return {
    campaignName: campaignFields.title,
    campaignSummary: campaignFields.campaignSummary,
    targetAudience: campaignFields.targetAudience,
    brandTone: campaignFields.brandTone,
    marketingGoals: campaignFields.marketingGoals,
    contentCalendar: campaignFields.contentCalendar,
    captions: campaignFields.captions,
    hashtags: campaignFields.hashtags,
    imagePrompts: resolvedImagePrompts,
    ...rest,
  };
};

const normalizeCampaignResponse = (campaignDoc) => {
  if (!campaignDoc) {
    return null;
  }

  const campaign = typeof campaignDoc.toObject === 'function' ? campaignDoc.toObject({ virtuals: false }) : { ...campaignDoc };
  const aiOutput = isPlainObject(campaign.aiOutput) ? campaign.aiOutput : {};
  const normalizedFields = normalizeCampaignFields(campaign, {
    title: campaign.title,
    description: campaign.description,
    campaignSummary: campaign.campaignSummary,
    targetAudience: campaign.targetAudience,
    brandTone: campaign.brandTone,
    marketingGoals: campaign.marketingGoals,
    contentCalendar: campaign.contentCalendar,
    captions: campaign.captions,
    hashtags: campaign.hashtags,
    imagePrompts: campaign.imagePrompts,
    aiOutput,
  });

  return {
    ...campaign,
    ...normalizedFields,
    aiOutput: buildLegacyAiOutput(normalizedFields, {
      sourceDetails: aiOutput.sourceDetails || {},
      generationModel: aiOutput.generationModel,
      generatedAt: aiOutput.generatedAt,
      imagePrompts: hasItems(normalizeImagePromptObjects(aiOutput.imagePrompts))
        ? normalizeImagePromptObjects(aiOutput.imagePrompts)
        : normalizeImagePromptObjects(campaign.imagePrompts),
    }),
  };
};

const normalizeCampaignUpdatePayload = (payload, fallback = {}) => {
  if (!isPlainObject(payload)) {
    return {};
  }

  const update = normalizeCampaignFields(payload, fallback);
  const stringFields = ['companyName', 'industry', 'description', 'campaignGoal', 'sourcePrompt', 'status'];

  stringFields.forEach((field) => {
    if (typeof payload[field] === 'string') {
      update[field] = payload[field].trim();
    }
  });

  if (Array.isArray(payload.platforms)) {
    const platforms = normalizeStringArray(payload.platforms);

    if (platforms.length > 0) {
      update.platforms = platforms;
    }
  }

  if (payload.budget !== undefined) {
    const numericBudget = Number(payload.budget);
    update.budget = Number.isFinite(numericBudget) ? numericBudget : payload.budget;
  }

  update.aiOutput = buildLegacyAiOutput(update, {
    sourceDetails: isPlainObject(payload?.aiOutput?.sourceDetails) ? payload.aiOutput.sourceDetails : isPlainObject(payload?.sourceDetails) ? payload.sourceDetails : {},
    generationModel: payload?.aiOutput?.generationModel || payload?.generationModel,
    generatedAt: payload?.aiOutput?.generatedAt || payload?.generatedAt,
  });

  return update;
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
  const normalizedFields = normalizeCampaignFields(payload, {});
  const imagePrompts = normalizeImagePromptStrings(payload?.imagePrompts).length
    ? normalizeImagePromptStrings(payload.imagePrompts)
    : normalizeImagePromptStrings(payload?.aiOutput?.imagePrompts).length
      ? normalizeImagePromptStrings(payload.aiOutput.imagePrompts)
      : normalizedFields.imagePrompts;
  const aiOutputImagePrompts = hasItems(normalizeImagePromptObjects(payload?.aiOutput?.imagePrompts))
    ? normalizeImagePromptObjects(payload.aiOutput.imagePrompts)
    : normalizeImagePromptObjects(payload?.imagePrompts);
  const campaign = await Campaign.create({
    ...payload,
    title: normalizedFields.title,
    campaignSummary: normalizedFields.campaignSummary,
    targetAudience: normalizedFields.targetAudience,
    brandTone: normalizedFields.brandTone,
    marketingGoals: normalizedFields.marketingGoals,
    contentCalendar: normalizedFields.contentCalendar,
    captions: normalizedFields.captions,
    hashtags: normalizedFields.hashtags,
    imagePrompts,
    aiOutput: isPlainObject(payload?.aiOutput)
      ? buildLegacyAiOutput(normalizedFields, {
          ...payload.aiOutput,
          imagePrompts: hasItems(aiOutputImagePrompts) ? aiOutputImagePrompts : normalizedFields.imagePrompts,
        })
      : payload.aiOutput,
    owner: userId,
  });

  const populatedCampaign = await Campaign.findById(campaign._id).populate('owner', 'fullName email profilePicture role');

  return normalizeCampaignResponse(populatedCampaign);
};

export const saveGeneratedCampaign = async (userId, payload) => {
  const campaignPlan = getCampaignPlan(payload);
  const sourceDetails = getSourceDetails(payload);
  const normalizedFields = normalizeCampaignFields(
    {
      ...payload,
      ...campaignPlan,
      ...sourceDetails,
    },
    {}
  );
  const companyName = normalizeString(
    payload?.companyName,
    normalizeString(sourceDetails.companyName, normalizeString(sourceDetails.title, normalizeString(normalizedFields.title, 'Unknown Company')))
  );
  const industry = normalizeString(payload?.industry, normalizeString(sourceDetails.industry, 'General'));
  const campaignGoal = normalizeString(
    payload?.campaignGoal,
    normalizeString(sourceDetails.campaignGoal, normalizeString(normalizedFields.campaignSummary, 'Generate awareness'))
  );
  const payloadPlatforms = normalizeStringArray(payload?.platforms);
  const sourcePlatforms = normalizeStringArray(sourceDetails.platforms);
  const platforms = payloadPlatforms.length ? payloadPlatforms : sourcePlatforms.length ? sourcePlatforms : ['General'];
  const numericBudget = Number(payload?.budget ?? sourceDetails.budget ?? 0);
  const budgetValue = Number.isFinite(numericBudget) ? numericBudget : 0;
  const aiOutputImagePrompts = hasItems(normalizeImagePromptObjects(payload?.campaignPlan?.imagePrompts))
    ? normalizeImagePromptObjects(payload.campaignPlan.imagePrompts)
    : hasItems(normalizeImagePromptObjects(payload?.aiOutput?.imagePrompts))
      ? normalizeImagePromptObjects(payload.aiOutput.imagePrompts)
      : normalizeImagePromptObjects(payload?.imagePrompts);

  const aiOutput = buildLegacyAiOutput(normalizedFields, {
    sourceDetails,
    generationModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    generatedAt: new Date().toISOString(),
    imagePrompts: aiOutputImagePrompts.length ? aiOutputImagePrompts : normalizedFields.imagePrompts,
  });

  const campaign = await Campaign.create({
    title: normalizedFields.title,
    companyName,
    industry,
    description: normalizeString(
      payload?.description,
      normalizeString(sourceDetails.description, normalizeString(normalizedFields.campaignSummary, normalizeString(payload?.sourcePrompt, 'Generated campaign')))
    ),
    campaignSummary: normalizedFields.campaignSummary,
    targetAudience: normalizedFields.targetAudience,
    campaignGoal,
    platforms,
    budget: budgetValue,
    status: payload?.status || 'Ready',
    sourcePrompt: normalizeString(payload?.sourcePrompt, normalizeString(sourceDetails.description, '')),
    brandTone: normalizedFields.brandTone,
    marketingGoals: normalizedFields.marketingGoals,
    contentCalendar: normalizedFields.contentCalendar,
    captions: normalizedFields.captions,
    hashtags: normalizedFields.hashtags,
    imagePrompts: normalizedFields.imagePrompts,
    aiOutput,
    owner: userId,
  });

  const populatedCampaign = await Campaign.findById(campaign._id).populate('owner', 'fullName email profilePicture role');

  return normalizeCampaignResponse(populatedCampaign);
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
  const campaign = await getCampaignByIdForUser(campaignId, userId);
  return normalizeCampaignResponse(campaign);
};

export const updateCampaign = async (campaignId, userId, payload) => {
  const campaign = await getCampaignByIdForUser(campaignId, userId);
  const updatePayload = normalizeCampaignUpdatePayload(payload, campaign);
  const aiOutputImagePrompts = hasItems(normalizeImagePromptObjects(payload?.aiOutput?.imagePrompts))
    ? normalizeImagePromptObjects(payload.aiOutput.imagePrompts)
    : hasItems(normalizeImagePromptObjects(payload?.imagePrompts))
      ? normalizeImagePromptObjects(payload.imagePrompts)
      : hasItems(normalizeImagePromptObjects(campaign?.aiOutput?.imagePrompts))
        ? normalizeImagePromptObjects(campaign.aiOutput.imagePrompts)
        : normalizeImagePromptObjects(campaign.imagePrompts);

  Object.assign(campaign, updatePayload);
  campaign.aiOutput = buildLegacyAiOutput(updatePayload, {
    sourceDetails: isPlainObject(payload?.aiOutput?.sourceDetails) ? payload.aiOutput.sourceDetails : isPlainObject(payload?.sourceDetails) ? payload.sourceDetails : {},
    generationModel: payload?.aiOutput?.generationModel || payload?.generationModel,
    generatedAt: payload?.aiOutput?.generatedAt || payload?.generatedAt,
    imagePrompts: aiOutputImagePrompts.length ? aiOutputImagePrompts : updatePayload.imagePrompts,
  });

  await campaign.save();

  const populatedCampaign = await Campaign.findById(campaign._id).populate('owner', 'fullName email profilePicture role');

  return normalizeCampaignResponse(populatedCampaign);
};

export const deleteCampaign = async (campaignId, userId) => {
  const campaign = await getCampaignByIdForUser(campaignId, userId);
  await campaign.deleteOne();

  return { deletedCampaignId: campaignId };
};
