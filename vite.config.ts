import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => ({
  // Base path set to root for Vercel deployment
  base: '/',
  server: {
    host: "::",
    port: 7000,
  },
  plugins: [
    react(),
    checker({
      typescript: {
        tsconfigPath: 'tsconfig.app.json',
      },
      overlay: {
        initialIsOpen: false,
      },
      terminal: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Firebase configuration for local development
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify("AIzaSyACmbQq896POzJilZF9LlDdCCoRX6FbojM"),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify("draggynote.firebaseapp.com"),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify("draggynote"),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify("draggynote.firebasestorage.app"),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify("231426073899"),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify("1:231426073899:web:d763d649623b6488b2d16e"),
    'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify("G-Q1DY5GM3TY"),
  },
}));
