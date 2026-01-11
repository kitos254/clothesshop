import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  withCredentials: true, // Include cookies for refresh tokens
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints (login, register, refresh)
    const isAuthEndpoint = originalRequest.url?.includes('/customer/auth/login') ||
                           originalRequest.url?.includes('/customer/auth/register') ||
                           originalRequest.url?.includes('/customer/auth/refresh');

    // Check if error is 401, we haven't already tried to refresh, and it's not an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/customer/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.token;
        
        if (newToken) {
          localStorage.setItem('customerToken', newToken);
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, remove token
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customer');
        // Don't redirect here, let the auth context handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
