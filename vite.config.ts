import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
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
