import apiClient from '../../api/apiClient.js';

export function getImageUrl(path) {
  if (!path) {
    return null;
  }

  return `https://placehold.co/800x800/png?text=Image+Preview`;
}

export async function generateCampaignImage(payload) {
  const response = await apiClient.post('/api/images/generate', payload);
  return {
    data: response.data?.data ?? null,
    message: response.data?.message ?? 'Image generated successfully.',
  };
}

export async function regenerateCampaignImage(payload) {
  const response = await apiClient.post('/api/images/regenerate', payload);
  return {
    data: response.data?.data ?? null,
    message: response.data?.message ?? 'Image regenerated successfully.',
  };
}

export async function acceptCampaignImage(payload) {
  const response = await apiClient.post('/api/images/accept', payload);
  return {
    data: response.data?.data ?? null,
    message: response.data?.message ?? 'Image accepted successfully.',
  };
}

const imageApi = {
  getImageUrl,
  generateCampaignImage,
  regenerateCampaignImage,
  acceptCampaignImage,
};

export default imageApi;
