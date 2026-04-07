import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,          // expose on all network interfaces (0.0.0.0)
    allowedHosts: 'all'  // allow any host including ngrok
  }
});
