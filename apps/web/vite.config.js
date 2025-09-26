import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173, 
    strictPort: true,
    // Disable error overlay while fixing configs
    hmr: { overlay: false },
    // Dev proxy to FastAPI
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path, // keep /api prefix
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: '@admin',
        replacement: path.resolve(__dirname, 'src/admin'),
      },
    ],
  },
});
