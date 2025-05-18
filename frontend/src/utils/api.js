import axios from 'axios';
import Session from 'supertokens-auth-react/recipe/session';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9010',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for SuperTokens cookie-based auth
});

// Add a request interceptor to include the admin token only for admin routes
api.interceptors.request.use(
  async (config) => {
    const isAdminRoute =
      (config.url.startsWith('/fabric/admin') && config.url !== '/fabric/admin/login') ||
      config.url.startsWith('/admin/') ||
      config.url === '/initLedger';

    // Only add admin token for admin-specific routes
    if (isAdminRoute) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle SuperTokens session expiry
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      if (error.response && error.response.status === 401) {
        // For SuperTokens related authentication failures
        const isSessionExist = await Session.doesSessionExist();
        if (!isSessionExist) {
          // Session has expired, redirect to auth page
          window.location.href = "/auth";
        }
      }
      return Promise.reject(error);
    }
    // Handle admin authentication failures
    if (error.response.status === 403 &&
      error.config.url &&
      (error.config.url.includes('/admin/') ||
        error.config.url.includes('/fabric/admin') ||
        error.config.url === '/initLedger')) {
      // Admin token might be invalid
      console.error('Admin authentication failed');
      // Optionally redirect to admin login
      window.location.href = "/admin";
    }
  }
);

export default api;