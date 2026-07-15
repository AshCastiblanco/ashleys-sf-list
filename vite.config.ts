import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://ashcastiblanco.github.io/ashleys-sf-list/
  base: '/ashleys-sf-list/',
  plugins: [react()],
})
