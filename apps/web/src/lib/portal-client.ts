import axios from 'axios';

import { API_BASE_URL } from './api-client';

export const PORTAL_TOKEN_KEY = 'portal_token';
export const PORTAL_SESSION_KEY = 'portal_session';

/**
 * Patient-portal axios client — same envelope behavior as the staff client,
 * but a separate token namespace so staff and patient sessions never collide.
 */
export const portalClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

portalClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(PORTAL_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return Promise.reject(error.response?.data || error.message);
  },
);
