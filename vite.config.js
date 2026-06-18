import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/workout-program/',
  plugins: [react()],
  server: {
    host: true,
  },
})