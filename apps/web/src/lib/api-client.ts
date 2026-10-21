import axios from 'axios';

/**
 * Tenant slug used when the host has no usable subdomain — typical of the
 * single-origin Vercel deployment (e.g. `entrustic-beauty.vercel.app`), which
 * only has two hostname labels. Configurable per deployment via VITE_TENANT_SLUG.
 */
export const DEFAULT_TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || 'entrustic-beauty';

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
