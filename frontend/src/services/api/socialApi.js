export async function getSocialConnections() {
  return { data: { linkedin: false, instagram: false } };
}

export async function connectLinkedIn() {
  return { error: null };
}

export async function connectInstagram() {
  return { error: null };
}

export async function disconnectSocialAccount() {
  return { error: null };
}

const socialApi = {
  getSocialConnections,
  connectLinkedIn,
  connectInstagram,
  disconnectSocialAccount,
};

export default socialApi;
