import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    proxy: {
      // Forward Socket.IO and API to backend during dev
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/health': {
        target: 'http://localhost:3000',
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

