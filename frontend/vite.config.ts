import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 하위 경로: https://jmankimkr-lgtm.github.io/tmw/
export default defineConfig({
  base: '/tmw/',
  plugins: [react()],
})
