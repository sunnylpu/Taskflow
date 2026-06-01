/**
 * axiosClient.js — Axios HTTP client
 *
 * Security rules:
 * - Tokens stored in memory (React Context), NOT localStorage
 * - Authorization header injected from in-memory token only
 * - No credentials logged in interceptors
 * - HTTPS enforced in production via baseURL
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Token is injected from AuthContext — not read from localStorage
let _authToken = null;

export function setAuthToken(token) {
  _authToken = token;
}

export function clearAuthToken() {
  _authToken = null;
}

// Request interceptor — attach Bearer token if present (in-memory only)
apiClient.interceptors.request.use(
  (config) => {
    if (_authToken) {
      config.headers['Authorization'] = `Bearer ${_authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors (never log tokens)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    // Create a normalized error (no token data)
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status;
    normalizedError.errors = error.response?.data?.errors;
    return Promise.reject(normalizedError);
  }
);

export default apiClient;
