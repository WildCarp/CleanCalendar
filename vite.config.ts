import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/CleanCalendar/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/holiday': {
        target: 'https://holiday.ailcc.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/holiday/, '/api/holiday'),
      },
    },
  },
});
