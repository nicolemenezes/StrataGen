// /frontend/src/services/apiClient.ts

import axios from 'axios';

const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
  },
} as any; // TODO: restore Supabase auth wiring after the client is reintroduced.

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Axios interceptor to add the JWT to every request
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    
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
