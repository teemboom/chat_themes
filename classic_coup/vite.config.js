import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue()
  ],
  define: {
    'process.env': {}
  },
  build: {
    cssCodeSplit: false, // inline CSS into JS
    assetsInlineLimit: 100000000, // inline all images/fonts
    lib: {
      entry: 'src/main.js',
      name: 'TeemboomClassicCoup',
      formats: ['iife'],
      fileName: () => 'teemboom_app.js'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'teemboom_app.css'
          }
          return '[name][extname]'
        }
      }
    }
  }
})
