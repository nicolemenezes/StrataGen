const BACKEND_NOT_IMPLEMENTED_ERROR = 'Backend not implemented.';

const mockSession = {
  access_token: 'mock-access-token',
  provider_token: 'mock-linkedin-token',
  user: {
    id: 'mock-user-id',
    email: 'demo@stratagen.local',
    user_metadata: {
      full_name: 'Demo User',
    },
  },
};

function notImplemented() {
  return { error: null };
}

export async function signIn() {
  return { error: null, data: { session: mockSession } };
}

export async function signUp() {
  return { error: null, data: { user: mockSession.user } };
}

export async function signOut() {
  return { error: null };
}

export async function getSession() {
  return { data: { session: mockSession } };
}

export function onAuthStateChange(callback) {
  if (typeof callback === 'function') {
    callback('SIGNED_IN', mockSession);
  }

  return {
    data: {
      subscription: {
        unsubscribe: () => undefined,
      },
    },
  };
}

const authApi = {
  signIn,
  signUp,
  signOut,
  getSession,
  onAuthStateChange,
};

export default authApi;
