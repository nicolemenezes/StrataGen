import apiClient from '../../api/apiClient.js';

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const asStringArray = (value) =>
  Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];

const asObjectArray = (value) =>
  Array.isArray(value) ? value.filter((item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : [];

const normalizeCampaign = (rawCampaign) => {
  const campaign = isPlainObject(rawCampaign?.campaign) ? rawCampaign.campaign : rawCampaign;

  if (!isPlainObject(campaign)) {
    return null;
  }

  const aiOutput = isPlainObject(campaign.aiOutput) ? campaign.aiOutput : {};
  const normalizedTitle = asString(campaign.title) || asString(aiOutput.campaignName);
  const normalizedCampaignSummary = asString(campaign.campaignSummary) || asString(aiOutput.campaignSummary) || asString(campaign.description);
  const normalizedTargetAudience = asString(campaign.targetAudience) || asString(aiOutput.targetAudience);
  const normalizedBrandTone = asString(campaign.brandTone) || asString(aiOutput.brandTone);
  const normalizedMarketingGoals = asStringArray(campaign.marketingGoals).length
    ? asStringArray(campaign.marketingGoals)
    : asStringArray(aiOutput.marketingGoals);
  const normalizedContentCalendar = asObjectArray(campaign.contentCalendar).length
    ? asObjectArray(campaign.contentCalendar)
    : asObjectArray(aiOutput.contentCalendar);
  const normalizedCaptions = asObjectArray(campaign.captions).length ? asObjectArray(campaign.captions) : asObjectArray(aiOutput.captions);
  const normalizedHashtags = asStringArray(campaign.hashtags).length ? asStringArray(campaign.hashtags) : asStringArray(aiOutput.hashtags);
  const normalizedImagePrompts = asStringArray(campaign.imagePrompts).length
    ? asStringArray(campaign.imagePrompts)
    : asObjectArray(aiOutput.imagePrompts)
      .map((item) => asString(item.prompt))
      .filter(Boolean);

  return {
    ...campaign,
    title: normalizedTitle || campaign.title || '',
    campaignSummary: normalizedCampaignSummary,
    targetAudience: normalizedTargetAudience,
    brandTone: normalizedBrandTone,
    marketingGoals: normalizedMarketingGoals,
    contentCalendar: normalizedContentCalendar,
    captions: normalizedCaptions,
    hashtags: normalizedHashtags,
    imagePrompts: normalizedImagePrompts,
  };
};

export async function getCampaigns(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const response = await apiClient.get(`/api/campaigns${queryString ? `?${queryString}` : ''}`);
  const responseData = response.data?.data ?? {};

  return {
    data: (responseData.campaigns ?? []).map((campaign) => normalizeCampaign(campaign)).filter(Boolean),
    pagination: responseData.pagination ?? {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function getCampaignById(campaignId) {
  const response = await apiClient.get(`/api/campaigns/${campaignId}`);
  return {
    data: normalizeCampaign(response.data?.data?.campaign ?? response.data?.data ?? null),
  };
}

export async function saveCampaign(payload) {
  const response = await apiClient.post('/api/campaigns/save', payload);
  return {
    data: normalizeCampaign(response.data?.data?.campaign ?? response.data?.data ?? null),
  };
}

export async function createCampaign() {
  return { data: null };
}

export async function updateCampaign() {
  return { data: null };
}

export async function updateCampaignById(campaignId, payload) {
  const response = await apiClient.put(`/api/campaigns/${campaignId}`, payload);

  return {
    data: normalizeCampaign(response.data?.data?.campaign ?? response.data?.data ?? null),
  };
}

export async function runCampaign() {
  return { data: { ok: true } };
}

export async function approveCampaign() {
  return { data: { ok: true } };
}

export async function sendCampaignCommand() {
  return { data: { ok: true } };
}

export async function updateCampaignCopy(copyId, content) {
  return { data: { id: copyId, content } };
}

export async function getCampaignChat() {
  return { data: [] };
}

export async function strategizeAndChat() {
  return { data: { campaign_id: null, initial_reply: '' } };
}

export async function continueCampaignChat() {
  return { data: { reply: '' } };
}

const campaignApi = {
  getCampaigns,
  getCampaignById,
  saveCampaign,
  createCampaign,
  updateCampaign,
  updateCampaignById,
  runCampaign,
  approveCampaign,
  sendCampaignCommand,
  updateCampaignCopy,
  getCampaignChat,
  strategizeAndChat,
  continueCampaignChat,
};

export default campaignApi;
