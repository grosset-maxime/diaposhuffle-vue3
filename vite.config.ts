import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }), // Enabled by default
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use 'vuetify/settings';
        @use 'sass:math';
        ${[
    '@/styles/_variables.uikit',
    '@/styles/_mixins.uikit',
    '@/styles/_variables',
    '@/styles/_mixins',
  ]
    .map((v) => `@import "${v}.scss";`)
    .join('')}`,
      },
    },
  },
})
