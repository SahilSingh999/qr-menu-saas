import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // expose on all network interfaces (0.0.0.0)
    port: 5173,
    strictPort: false, // pick next available port if 5173 is taken
  },
})

