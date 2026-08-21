import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const fromRoot = (...segments) => path.resolve(rootDir, ...segments);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: fromRoot('src/components'),
      services: fromRoot('src/services'),
      'App.css': fromRoot('src/App.css'),
    },
  },
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('antd') || id.includes('@ant-design') || id.includes('@rc-component') || id.includes('rc-')) {
            return 'antd-vendor';
          }

          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});
