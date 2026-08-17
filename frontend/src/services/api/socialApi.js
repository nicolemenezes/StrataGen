import apiClient from '../../api/apiClient.js';

export async function getSocialConnections() {
  return { data: { linkedin: false, instagram: false } };
}

export async function connectLinkedIn() {
  return { error: null };
}

export async function getInstagramConnection() {
  const response = await apiClient.get('/api/social/instagram');
  return { data: response.data?.data?.connection ?? null };
}

export async function connectInstagram(campaignId) {
  if (!campaignId) {
    return { data: null };
  }

  const response = await apiClient.get('/api/social/instagram/connect', {
    params: { campaignId },
  });

  return { data: response.data?.data ?? null };
}

export async function disconnectInstagram() {
  const response = await apiClient.delete('/api/social/instagram');
  return { data: response.data?.data?.connection ?? null };
}

export async function disconnectSocialAccount() {
  return disconnectInstagram();
}

const socialApi = {
  getSocialConnections,
  connectLinkedIn,
  connectInstagram,
  getInstagramConnection,
  disconnectInstagram,
  disconnectSocialAccount,
};

export default socialApi;
