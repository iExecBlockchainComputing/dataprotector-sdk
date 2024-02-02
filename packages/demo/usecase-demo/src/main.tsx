import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/mulish';
import '@fontsource-variable/anybody/wdth.css';
import { RouterProvider } from '@tanstack/react-router';
import { WagmiConfig } from 'wagmi';
import './index.css';
import { Toaster } from './components/ui/toaster.tsx';
import { wagmiConfig } from './utils/wagmiConfig.ts';
import { initRouter } from './initRouter.ts';

const queryClient = new QueryClient();

const router = initRouter(queryClient);

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </WagmiConfig>
    <Toaster />
  </React.StrictMode>
);
