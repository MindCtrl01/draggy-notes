// API Configuration for local development and deployment
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // Production: Use environment variable
    return import.meta.env.VITE_API_BASE_URL || 'https://your-production-api.com/api';
  }
  
  // Development: Use local HTTPS development server
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5231';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
} as const;

// Environment detection using Vercel's system
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
// export const isVercelDeployment = !!import.meta.env.VITE_VERCEL_URL;
