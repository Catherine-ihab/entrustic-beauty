import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@clinic/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Splitting antd away from react produces chunks that are loaded
        // independently, and Rollup then executes `vendor-antd` before React
        // has initialised. antd calls React.createContext at module scope, so
        // the page died with "Cannot read properties of undefined (reading
        // 'createContext')" and rendered nothing. Keeping the React family
        // together preserves the required initialisation order.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (id.includes('antd') || id.includes('@ant-design') || id.includes('rc-')) {
            return 'vendor-antd';
          }
          return 'vendor';
        },
      },
    },
  },
});
