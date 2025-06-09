import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/whatsapp': {
        target: `${process.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-api`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/whatsapp/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    }
  }
});