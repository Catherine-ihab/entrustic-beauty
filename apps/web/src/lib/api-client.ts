import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If running in development with custom tenant override parameter
  const overrideSlug = localStorage.getItem('dev_tenant_slug');
  if (overrideSlug && import.meta.env.DEV) {
    config.headers['x-tenant-slug'] = overrideSlug;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return Promise.reject(error.response?.data || error.message);
  },
);
