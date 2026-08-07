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

export async function generateCampaign(campaignDetails) {
  const response = await apiClient.post('/api/ai/generate-campaign', {
    campaignDetails: buildCampaignDetails(campaignDetails),
  });

  return {
    data: response.data,
  };
}

export async function generateStrategy(campaignDetails) {
  return generateCampaign(campaignDetails);
}

export async function generateCaption(campaignDetails) {
  return generateCampaign(campaignDetails);
}

export async function generateBlogTitle(campaignDetails) {
  return generateCampaign(campaignDetails);
}

export async function generateBlogBody(campaignDetails) {
  return generateCampaign(campaignDetails);
}

export async function generateCopy(campaignDetails) {
  return generateCampaign(campaignDetails);
}

const aiApi = {
  generateCampaign,
  generateStrategy,
  generateCaption,
  generateBlogTitle,
  generateBlogBody,
  generateCopy,
};

export default aiApi;
