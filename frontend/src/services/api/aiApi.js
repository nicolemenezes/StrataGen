import apiClient from '../../api/apiClient.js';

const buildCampaignDetails = (campaignDetails) => {
  if (typeof campaignDetails === 'string') {
    const prompt = campaignDetails.trim();

    return {
      title: 'New Campaign Strategy',
      description: prompt,
      campaignGoal: prompt,
      keyMessage: prompt,
      additionalNotes: prompt,
    };
  }

  if (campaignDetails && typeof campaignDetails === 'object') {
    return campaignDetails;
  }

  return {};
};

const unwrapResponse = (response, key) => {
  const payload = response?.data?.data;

  if (payload && typeof payload === 'object' && key in payload) {
    return payload[key];
  }

  return payload ?? response?.data ?? null;
};

export async function generateCampaign(campaignDetails) {
  const response = await apiClient.post('/api/ai/generate-campaign', {
    campaignDetails: buildCampaignDetails(campaignDetails),
  });

  return {
    data: response.data?.data ?? unwrapResponse(response, 'campaignPlan'),
  };
}

export async function generateStrategy(campaignDetails) {
  const response = await apiClient.post('/api/ai/generate-strategy', {
    campaignDetails: buildCampaignDetails(campaignDetails),
  });

  return {
    data: unwrapResponse(response, 'strategy'),
  };
}

export async function generateCaption(campaignDetails) {
  const response = await apiClient.post('/api/ai/generate-content', {
    campaignDetails: buildCampaignDetails(campaignDetails),
  });

  return {
    data: unwrapResponse(response, 'content'),
  };
}

export async function generateBlogTitle(campaignDetails) {
  return generateCaption(campaignDetails);
}

export async function generateBlogBody(campaignDetails) {
  return generateCaption(campaignDetails);
}

export async function generateCopy(campaignDetails) {
  return generateCaption(campaignDetails);
}

export async function refineCampaignPlan(payload) {
  const response = await apiClient.post('/api/ai/refine-campaign', payload);

  return {
    data: unwrapResponse(response, 'campaignPlan'),
  };
}

const aiApi = {
  generateCampaign,
  generateStrategy,
  generateCaption,
  generateBlogTitle,
  generateBlogBody,
  generateCopy,
  refineCampaignPlan,
};

export default aiApi;
