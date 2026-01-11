// Environment utilities
export const env = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'NewRan Admin',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  
  // Feature flags
  ENABLE_LOGS: import.meta.env.VITE_ENABLE_LOGS === 'true',
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1440, // minutes
  
  // Helper functions
  isDevelopment: () => import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development',
  isProduction: () => import.meta.env.PROD || import.meta.env.VITE_NODE_ENV === 'production',
  
  // Get all environment variables for debugging
  getAll: () => ({
    API_BASE_URL: env.API_BASE_URL,
    API_TIMEOUT: env.API_TIMEOUT,
    APP_NAME: env.APP_NAME,
    APP_VERSION: env.APP_VERSION,
    NODE_ENV: env.NODE_ENV,
    ENABLE_LOGS: env.ENABLE_LOGS,
    SESSION_TIMEOUT: env.SESSION_TIMEOUT,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  })
};

// Log environment info in development
if (env.isDevelopment() && env.ENABLE_LOGS) {
  console.log('🌍 Environment Configuration:', env.getAll());
}
