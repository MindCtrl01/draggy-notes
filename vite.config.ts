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
      typescript: true,
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
}));
