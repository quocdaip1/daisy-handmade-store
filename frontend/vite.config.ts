import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.API_PROXY_TARGET || 'http://127.0.0.1:8000'
  const proxy = {
    '/api': { target: backendTarget, changeOrigin: true },
    '/storage': { target: backendTarget, changeOrigin: true },
  }
  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
