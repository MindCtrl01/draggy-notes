// API Configuration for Vercel deployment
// Note: API calls are temporarily disabled
const getApiBaseUrl = () => {
  // Return a placeholder URL since API is disabled
  if (import.meta.env.PROD) {
    // Production: Use environment variable or placeholder
    return import.meta.env.VITE_API_BASE_URL || 'https://api.placeholder.com/api';
  }
  
  // Development: Use local development server or placeholder
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5231/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
} as const;

// Environment detection using Vercel's system
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
// export const isVercelDeployment = !!import.meta.env.VITE_VERCEL_URL;
