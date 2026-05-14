import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/workout-vantage/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Workout Vantage',
        short_name: 'WorkoutVantage',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/workout-vantage/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/workout-vantage/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/workout-vantage/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
