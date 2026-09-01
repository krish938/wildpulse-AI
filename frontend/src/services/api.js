/**
 * src/services/api.js
 * Centralized Axios instance for all backend API calls.
 *
 * Why a centralized service?
 * - One place to set the base URL
 * - One place to add auth headers in the future
 * - All components use the same Axios instance
 */

import axios from 'axios';

// The backend URL is set in .env as VITE_API_BASE_URL
// Vite exposes env vars prefixed with VITE_ to the frontend
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Runs before every request — useful for adding auth tokens in the future
api.interceptors.request.use(
  (config) => {
    // Future: config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Runs after every response — extract common error info
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize the error message for display in components
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    error.displayMessage = message;
    return Promise.reject(error);
  }
);

// ─── API Functions ─────────────────────────────────────────────────────────────

/** Check backend health */
export const getHealth = () => api.get('/health');

/** Fetch fire hotspots from NASA FIRMS (via backend).
 * @param {boolean} [forceRefresh=false] - Pass true to bypass the 10-min backend cache
 */
export const getFireHotspots = (forceRefresh = false) =>
  api.get('/fires', { params: forceRefresh ? { refresh: 'true' } : {} });

/** Fetch current weather for a location */
export const getWeather = (latitude, longitude) =>
  api.get('/weather', { params: { latitude, longitude } });

/** Get wildfire risk for a location */
export const getRisk = (latitude, longitude) =>
  api.get('/risk', { params: { latitude, longitude } });

/** Get all fire reports */
export const getReports = (params = {}) => api.get('/reports', { params });

/** Submit a new fire report */
export const createReport = (reportData) => api.post('/reports', reportData);

/** Get a single fire report by ID */
export const getReportById = (id) => api.get(`/reports/${id}`);

/** Update a fire report */
export const updateReport = (id, updates) => api.patch(`/reports/${id}`, updates);

export default api;
