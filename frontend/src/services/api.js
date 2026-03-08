
import axios from 'axios';
// =====================================
// Configuration
// =====================================
// API base URL - can be overridden by environment variable
// Default to v1 endpoint
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with credentials enabled for cookies
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // IMPORTANT: Allow cookie transmission
});

// =====================================
// Authentication Helpers
// =====================================
// No longer store token in localStorage - token is in httpOnly cookie
export const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('csrfToken');
};

// =====================================
// CSRF Token Management
// =====================================
export const fetchCsrfToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    const csrfToken = response.data?.csrfToken;
    if (csrfToken) {
      localStorage.setItem('csrfToken', csrfToken);
      api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
    }
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

// =====================================
// Request Interceptor
// Add CSRF token to state-changing requests
// =====================================
api.interceptors.request.use(
  (config) => {
    // Token is automatically sent via cookie, no need to add to headers
    
    // Add CSRF token for state-changing operations
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Let the browser set multipart boundaries automatically for file uploads
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Content-Type', undefined);
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================
// Response Interceptor
// Handle token refresh and standard format
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
  async (error) => {
    const status = error.response?.status || 500;
    const originalRequest = error.config;

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Handle Unauthorized (Token expired / invalid)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await api.post('/auth/refresh');
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        clearAuth();

        // Avoid redirect loop
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject({
          success: false,
          status: 401,
          error: 'Session expired. Please login again.',
          data: null,
        });
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
  post: (url, data = {}, config = {}) => api.post(url, data, config),

  // PUT
  put: (url, data = {}, config = {}) => api.put(url, data, config),

  // PATCH
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),

  // DELETE
  delete: (url) => api.delete(url),

  // File Upload
  upload: (url, formData, config = {}) => api.post(url, formData, config),
};

export default apiService;
