import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget.tsx'),
      name: 'ByHandleChatWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
})
