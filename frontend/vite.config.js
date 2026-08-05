import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
    allowedHosts: 'all'
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,   // don't drop — we override manually in main.jsx
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error', 'console.info', 'console.debug']
      }
    }
  }
});
