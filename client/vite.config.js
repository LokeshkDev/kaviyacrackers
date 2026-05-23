import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://127.0.0.1:3000'

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // Minify for better performance (use esbuild to avoid optional terser dependency)
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Optimize chunk size
          manualChunks(id) {
            if (id && id.includes('node_modules')) {
              if (id.includes('bootstrap')) return 'bootstrap';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
              return 'vendor';
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        }
      },
      // SEO friendly headers for development
      middlewareMode: false,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block'
      }
    },
    preview: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        }
      },
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block'
      }
    }
  }
})
