// API Configuration for Vercel deployment
const getApiBaseUrl = () => {
  // Vercel provides these environment variables automatically
  if (import.meta.env.PROD) {
    // Production: Use Vercel's environment variable or fallback to your API domain
    return import.meta.env.VITE_API_BASE_URL || 'https://your-api-domain.vercel.app/api';
  }
  
  // Development: Use local development server
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5231/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
} as const;

// Environment detection using Vercel's system
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
export const isVercelDeployment = !!import.meta.env.VITE_VERCEL_URL;
