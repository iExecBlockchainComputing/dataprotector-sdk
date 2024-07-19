import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // In prod, app will be served under `demo.iex.ec/content-creator` path
  const basePath =
    env.SET_SUBPATH_FOR_PROD === 'true' ? '/content-creator' : '/';
  console.log('[vite] Building with base path:', basePath);
  return {
    base: basePath,
    plugins: [react(), TanStackRouterVite()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
