// Example of using import.meta.env

// Built-in Vite variables
console.log('Is Development:', import.meta.env.DEV);           // true/false
console.log('Is Production:', import.meta.env.PROD);          // true/false  
console.log('Mode:', import.meta.env.MODE);                   // 'development'/'production'
console.log('Base URL:', import.meta.env.BASE_URL);           // '/' or '/draggy-notes/'

// Custom variables (must start with VITE_)
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);   // From .env file
console.log('App Title:', import.meta.env.VITE_APP_TITLE);    // From .env file
console.log('Debug Mode:', import.meta.env.VITE_DEBUG_MODE);  // From .env file

// With fallbacks
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const appTitle = import.meta.env.VITE_APP_TITLE || 'Draggy Notes';
const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

// Environment-specific configuration
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: import.meta.env.VITE_API_TIMEOUT || 10000,
  },
  app: {
    title: import.meta.env.VITE_APP_TITLE || 'Draggy Notes',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  features: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  }
};

// TypeScript support
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    readonly VITE_APP_TITLE: string;
    readonly VITE_DEBUG_MODE: string;
  }
}
