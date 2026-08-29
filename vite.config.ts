import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relatywny base sprawia, że build działa zarówno pod domeną główną,
// jak i pod ścieżką projektu na GitHub Pages (user.github.io/repo/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
