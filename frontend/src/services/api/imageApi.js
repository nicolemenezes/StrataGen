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

const imageApi = {
  getImageUrl,
  generateCampaignImage,
};

export default imageApi;
