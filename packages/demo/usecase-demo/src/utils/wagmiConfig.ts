import { createWeb3Modal } from '@web3modal/wagmi/react';
import { walletConnectProvider, EIP6963Connector } from '@web3modal/wagmi';
import { createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { bellecour } from './walletConnection.ts';

// Wagmi Client initialization
if (!import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID) {
  throw new Error(
    'You need to provide VITE_WALLET_CONNECT_PROJECT_ID env variable'
  );
}

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID!;

const { chains, publicClient } = configureChains(
  [bellecour],
  [walletConnectProvider({ projectId }), publicProvider()]
);

const metadata = {
  name: 'Web3Modal',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// Custom config instead of using defaultWagmiConfig
// https://docs.walletconnect.com/web3modal/react/about?platform=wagmi#implementation
// -> To avoid having @coinbase/wallet-sdk end up into our bundle
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: { projectId, showQrModal: false, metadata },
    }),
    // Needed to detect Metamask
    new EIP6963Connector({ chains }),
  ],
  publicClient,
});

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains, defaultChain: bellecour });
