import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: { compress: { drop_console: true, drop_debugger: true } },
    rollupOptions: {
      // the portfolio plus the two early-access pages
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        tux: resolve(import.meta.dirname, 'tux/index.html'),
        desk: resolve(import.meta.dirname, 'desk/index.html'),
      },
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap', 'lenis'],
          react: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
