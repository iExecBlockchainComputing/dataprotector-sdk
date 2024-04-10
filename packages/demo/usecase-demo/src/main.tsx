import '@fontsource-variable/anybody/wdth.css';
import '@fontsource/inter/400.css';
import '@fontsource/mulish/200.css';
import '@fontsource/mulish/400.css';
import '@fontsource/mulish/500.css';
import '@fontsource/mulish/600.css';
import '@fontsource/mulish/700.css';
import '@fontsource/mulish/800.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig } from 'wagmi';
import { Toaster } from './components/ui/toaster.tsx';
import './index.css';
import { initRouter } from './initRouter.ts';
import { DisclaimerModal } from './modules/DisclaimerModal.tsx';
import { wagmiConfig } from './utils/wagmiConfig.ts';

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
        <DisclaimerModal />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </WagmiConfig>
    <Toaster />
  </React.StrictMode>
);
