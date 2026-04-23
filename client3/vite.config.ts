import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), preact()],
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'https://lab4-rappi-ecosystem.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
