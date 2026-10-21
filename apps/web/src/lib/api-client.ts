import axios from 'axios';

/**
 * Tenant slug used when the host has no usable subdomain — typical of the
 * single-origin Vercel deployment (e.g. `entrustic-beauty.vercel.app`), which
 * only has two hostname labels. Configurable per deployment via VITE_TENANT_SLUG.
 */
export const DEFAULT_TENANT_SLUG = import.meta.env.VITE_TENANT_SLUG || 'entrustic-beauty';

/**
 * API base URL.
 *
 * Defaults to the relative `/api/v1` so the browser always calls whatever
 * origin served the page. This is what makes the single-origin deploy work
 * (Vercel serves both the SPA and the API). The previous default was an
 * absolute `http://localhost:3001/...`, which got baked into the production
 * bundle and made every visitor's browser call *their own* machine, so login
 * and the clinic config silently failed with CORS/connection errors.
 *
 * Set VITE_API_URL only when the API lives on a genuinely different origin.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
