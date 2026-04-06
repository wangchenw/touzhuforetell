import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const proxyTarget = env.VITE_API_PROXY_TARGET
    || (/^https?:\/\//.test(env.VITE_API_BASE_URL) ? env.VITE_API_BASE_URL : 'http://127.0.0.1:8000');
  const enableHmr = env.VITE_ENABLE_HMR === 'true' && process.env.DISABLE_HMR !== 'true';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // Default to a stable dev session without auto-refresh; opt back in with VITE_ENABLE_HMR=true.
      hmr: enableHmr,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/health': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
