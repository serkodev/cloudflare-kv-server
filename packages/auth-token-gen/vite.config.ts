import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      '~css.gg/': `${path.resolve(__dirname, 'node_modules/css.gg/icons')}/`,
      '@/': `${path.resolve(__dirname, '../../src')}/`,
    },
  },
  plugins: [vue()],
})
