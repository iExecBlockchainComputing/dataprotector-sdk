import '@fontsource-variable/anybody/wdth.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/mulish/latin-200.css';
import '@fontsource/mulish/latin-400.css';
import '@fontsource/mulish/latin-500.css';
import '@fontsource/mulish/latin-600.css';
import '@fontsource/mulish/latin-700.css';
import '@fontsource/mulish/latin-800.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Analytics } from '@vercel/analytics/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig } from 'wagmi';
import { ConditionalRollbarWrapper } from '@/components/ConditionalRollbarWrapper.tsx';
import { initQueryClient } from '@/utils/initQueryClient.ts';
import { initRollbarAlerting } from '@/utils/initRollbarAlerting.ts';
import { Toaster } from './components/ui/toaster.tsx';
import './index.css';
import { initRouter } from './initRouter.ts';
import { DisclaimerModal } from './modules/DisclaimerModal.tsx';
import { wagmiConfig } from './utils/wagmiConfig.ts';

const { rollbar, rollbarConfig } = initRollbarAlerting();

const queryClient = initQueryClient({ rollbar });

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
        <ConditionalRollbarWrapper
          rollbar={rollbar}
          rollbarConfig={rollbarConfig}
        >
          <RouterProvider router={router} basepath={import.meta.env.BASE_URL} />
        </ConditionalRollbarWrapper>
      </QueryClientProvider>
    </WagmiConfig>
    <DisclaimerModal />
    <Toaster />
    <Analytics />
  </React.StrictMode>
);
