import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          output: {
            entryFileNames: 'assets/index.js',
            chunkFileNames: 'assets/[name].js',
            assetFileNames: 'assets/[name][extname]',
          },
        },
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Fix MIME type issues for .js files
        middlewareMode: false,
        hmr: {
          host: 'localhost',
          port: 3000,
          protocol: 'ws',
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname || __dirname, '.'),
        }
      }
    };
});
