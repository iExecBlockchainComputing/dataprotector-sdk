import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/mulish';
import '@fontsource-variable/anybody/wdth.css';
import { RouterProvider } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import './index.css';
import { wagmiConfig } from './utils/wagmiConfig.ts';
import { router } from './router.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RouterProvider router={router} />
    </WagmiConfig>
  </React.StrictMode>
);
