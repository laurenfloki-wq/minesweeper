import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so assets resolve correctly inside the Capacitor WebView.
  base: './',
  build: {
    outDir: 'dist',
  },
});
