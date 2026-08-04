import apiClient from '../../api/apiClient.js';

const AUTH_STORAGE_KEY = 'stratagen.auth';
const AUTH_EVENT_NAME = 'stratagen-auth-change';

const getStoredAuth = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (_error) {
    return null;
  }
};

const storeAuth = (authState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: authState }));
};

const clearAuth = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: null }));
};

const normalizeSession = (authState) => {
  if (!authState?.token || !authState?.user) {
    return null;
  }

  return {
    access_token: authState.token,
    user: {
      id: authState.user.id,
      email: authState.user.email,
      user_metadata: {
        full_name: authState.user.fullName,
      },
    },
  };
};

export async function signIn({ email, password }) {
  const response = await apiClient.post('/api/auth/login', { email, password });
  const { user, token } = response.data.data;
  storeAuth({ token, user });

  return { data: { session: normalizeSession({ token, user }), user, token } };
}

export async function signUp({ fullName, email, password }) {
  const response = await apiClient.post('/api/auth/register', { fullName, email, password });
  const { user, token } = response.data.data;
  storeAuth({ token, user });

  return { data: { session: normalizeSession({ token, user }), user, token } };
}

export async function signOut() {
  clearAuth();
  return { error: null };
}

export async function getSession() {
  const storedAuth = getStoredAuth();
  return { data: { session: normalizeSession(storedAuth) } };
}

export function onAuthStateChange(callback) {
  const handleAuthChange = (event) => {
    const authState = event?.detail ?? getStoredAuth();
    callback?.('AUTH_CHANGED', normalizeSession(authState));
  };

  window.addEventListener(AUTH_EVENT_NAME, handleAuthChange);

  return {
    data: {
      subscription: {
        unsubscribe: () => {
          window.removeEventListener(AUTH_EVENT_NAME, handleAuthChange);
        },
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
