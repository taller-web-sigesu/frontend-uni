import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      // Docker Desktop uses a mounted Windows directory; polling keeps HMR reliable.
      usePolling: true,
      interval: 500,
    },
    hmr: {
      clientPort: 3000,
    },
    proxy: {
      '/api': {
        // En Docker el backend es `backend`; fuera de Docker usa VITE_PROXY_TARGET=http://localhost:8080.
        target: process.env.VITE_PROXY_TARGET || 'http://backend:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.js'],
    css: false,
    // Los recorridos de Playwright (e2e/) no corren con Vitest.
    include: ['src/**/*.test.{js,jsx}'],
  },
});
