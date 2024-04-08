import { MetaMaskInpageProvider } from '@metamask/providers';

/// <reference types="vite/client" />
declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
  }
}
