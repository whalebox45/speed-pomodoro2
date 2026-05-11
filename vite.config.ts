import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    Icons({ compiler: 'vue3' }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pomodoro.png'],
      manifest: {
        name: 'Speed Pomodoro',
        short_name: 'Pomodoro',
        description: 'A speed pomodoro timer app',
        theme_color: '#c0392b',
        background_color: '#1a1a1a',
        display: 'standalone',
        start_url: '.',
        icons: [
          {
            src: 'pomodoro.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pomodoro.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pomodoro.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 6273,
  },
})
