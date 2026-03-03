



import axios from 'axios';

// =====================================
// Configuration
// =====================================
// API base URL - can be overridden by environment variable
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================
// Authentication Helpers
// =====================================
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// =====================================
// Request Interceptor
// Add token to every request
// =====================================
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// =====================================
// Response Interceptor
// Standard success & error format
// =====================================
api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    const isWrapped =
      payload &&
      typeof payload === 'object' &&
      Object.prototype.hasOwnProperty.call(payload, 'success') &&
      Object.prototype.hasOwnProperty.call(payload, 'data');

    return {
      success: true,
      data: isWrapped ? payload.data : payload,
      status: response.status,
      message: (isWrapped && payload.message) || response.statusText,
    };
  },
  (error) => {
    const status = error.response?.status || 500;

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Handle Unauthorized (Token expired / invalid)
    if (status === 401) {
      clearAuth();

      // Avoid redirect loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Development logging only
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        status,
        message,
        data: error.response?.data,
      });
    }

    return Promise.reject({
      success: false,
      status,
      error: message,
      data: error.response?.data || null,
    });
  }
);

// =====================================
// API Methods
// =====================================
const apiService = {
  // GET
  get: (url, params = {}) => api.get(url, { params }),

  // POST
  post: (url, data = {}) => api.post(url, data),

  // PUT
  put: (url, data = {}) => api.put(url, data),

  // PATCH
  patch: (url, data = {}) => api.patch(url, data),

  // DELETE
  delete: (url) => api.delete(url),

  // File Upload
  upload: (url, formData) =>
    api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default apiService;
