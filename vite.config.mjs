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
      AuthContext: fromRoot('src/AuthContext.jsx'),
      AuthCallbackHandler: fromRoot('src/AuthCallbackHandler.js'),
      AuthLoginButton: fromRoot('src/AuthLoginButton.jsx'),
      'App.css': fromRoot('src/App.css'),
      'react-virtualized': fromRoot('node_modules/react-virtualized/dist/commonjs'),
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

          if (id.includes('@octokit') || id.includes('js-base64')) {
            return 'github-vendor';
          }

          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts-vendor';
          }

          if (id.includes('react-virtualized') || id.includes('react-window')) {
            return 'virtual-list-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});
