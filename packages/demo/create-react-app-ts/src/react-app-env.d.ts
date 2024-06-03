import { MetaMaskInpageProvider } from '@metamask/providers';

/// <reference types="react-scripts" />

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
  }
}
