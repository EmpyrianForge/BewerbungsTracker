import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Bewerbungs-Tracker',
        short_name: 'Bewerbungen',
        description: 'Behalte Bewerbungen, Gespräche und Follow-ups an einem Ort im Blick.',
        theme_color: '#0f5cc0',
        background_color: '#f3f6fb',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            // BA API — network only, graceful fail when offline
            urlPattern: /^https:\/\/rest\.arbeitsagentur\.de\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/jobs': {
        target: 'https://rest.arbeitsagentur.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jobs/, '/jobboerse/jobsuche-service/pc/v4/jobs'),
        headers: {
          'X-API-Key': 'jobboerse-jobsuche',
          'User-Agent': 'Jobsuche/2.9.2 (de.arbeitsagentur.jobboerse; build:1077; iOS 15.1.0) Alamofire/5.4.4',
        },
      },
    },
  },
})
