import axios from 'axios';

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const AUTH_STORAGE_KEY = 'stratagen.auth';

const getAuthToken = () => {
  try {
    const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);
    return parsedValue?.token || null;
  } catch (_error) {
    return null;
  }
};

export function createApiClient(options = {}) {
  const client = axios.create({
    baseURL: options.baseURL ?? DEFAULT_BASE_URL,
    ...options,
  });

  client.interceptors.request.use(
    (config) => {
      const token = getAuthToken();

      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );

  return client;
}

const apiClient = createApiClient();

export default apiClient;
