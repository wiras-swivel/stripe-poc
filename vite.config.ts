import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset paths keep the build portable for GitHub Pages project URLs.
  base: './',
  plugins: [react()],
});
