import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Check if we're building the widget specifically
  const isWidget = process.env.BUILD_TARGET === 'widget'
  const envDefine = {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  }

  if (isWidget) {
    return {
      plugins: [react()],
      define: envDefine,
      build: {
        outDir: 'dist',
        emptyOutDir: false, // Don't clear dist folder
        lib: {
          entry: resolve(__dirname, 'src/widget.tsx'),
          name: 'HandleChatWidget',
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
    }
  }

  // Default build for demo page
  return {
    plugins: [react()],
    define: envDefine,
    build: {
      sourcemap: true,
    },
  }
})
