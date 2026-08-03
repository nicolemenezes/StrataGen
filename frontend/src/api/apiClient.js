import axios from 'axios';

const DEFAULT_BASE_URL = import.meta.env.VITE_API_URL;

export function createApiClient(options = {}) {
  const client = axios.create({
    baseURL: options.baseURL ?? DEFAULT_BASE_URL,
    ...options,
  });

  client.interceptors.request.use(
    (config) => config,
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
