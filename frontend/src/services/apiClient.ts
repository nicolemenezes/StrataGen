// /frontend/src/services/apiClient.ts

import axios from 'axios';
import { getSession } from './api/authApi';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Axios interceptor reserved for future auth wiring.
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
