import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    }
  }

  // Add production-specific configurations
  if (command === 'build') {
    config.build = {
      // Output directory for production build
      outDir: 'dist',
      
      // Generate source maps for production (you can set to false to disable)
      sourcemap: false,
      
      // Optimize the build
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true
        }
      },
      
      // Configure chunks
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@heroicons/react', 'sonner'],
            auth: ['supertokens-auth-react', 'axios']
          },
          // Ensure chunks don't exceed recommended size
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  }

  return config
})