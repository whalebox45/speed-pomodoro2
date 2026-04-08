import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/speed-pomodoro/',
  plugins: [vue(), Icons({ compiler: 'vue3' })],
  server: {
    port: 6273,
  },
})
