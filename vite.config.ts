import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the existing code
      // Check both process.env (system) and loaded env (files)
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      // Increase the warning limit slightly (to 1000kb) to reduce noise
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manually split vendor chunks to improve caching and reduce single bundle size
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'firebase';
              }
              if (id.includes('@google/genai')) {
                return 'genai';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'ui-icons';
              }
              if (id.includes('react-markdown')) {
                return 'markdown';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  };
});