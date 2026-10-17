import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 约定： teammates 统一用 @ 指代 src 目录（徐潇的 api、刘庭彰的布局等均依赖此别名）
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
