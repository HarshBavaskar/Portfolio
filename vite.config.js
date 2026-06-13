import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries to enable better caching
          'three': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          'motion': ['framer-motion'],
          'ui': ['lucide-react'],
          'vendor': ['react', 'react-dom', 'lenis'],
        },
        // Optimize chunk sizes
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Reduce initial chunk size
    chunkSizeWarningLimit: 1000,
    // Optimize CSS
    cssCodeSplit: true,
    // Source maps only in development
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'three', '@react-three/fiber'],
  },
})
