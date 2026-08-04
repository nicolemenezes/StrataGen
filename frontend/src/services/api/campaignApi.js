import apiClient from '../../api/apiClient.js';

export async function getCampaigns(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const response = await apiClient.get(`/api/campaigns${queryString ? `?${queryString}` : ''}`);
  const responseData = response.data?.data ?? {};

  return {
    data: responseData.campaigns ?? [],
    pagination: responseData.pagination ?? {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function getCampaignById() {
  return { data: null };
}

export async function createCampaign() {
  return { data: null };
}

export async function updateCampaign() {
  return { data: null };
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
  createCampaign,
  updateCampaign,
  runCampaign,
  approveCampaign,
  sendCampaignCommand,
  updateCampaignCopy,
  getCampaignChat,
  strategizeAndChat,
  continueCampaignChat,
};

export default campaignApi;
