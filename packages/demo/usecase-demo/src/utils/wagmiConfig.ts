import { createWeb3Modal } from '@web3modal/wagmi/react';
import { http, createConfig, CreateConnectorFn } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { bellecour } from './bellecourChainConfig.ts';
import { InjectedWalletProvider } from './injected-wallet-provider/injected-wallet-provider.ts';
import { EIP6963ProviderDetail } from './injected-wallet-provider/types.ts';

// Wagmi Client initialization
if (!import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID) {
  throw new Error(
    'You need to provide VITE_WALLET_CONNECT_PROJECT_ID env variable'
  );
}

export const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID!;

// WalletConnect metadata
const metadata = {
  name: 'Content Creator demo dApp',
  description: 'Content Creator demo dApp',
  url: 'https://demo.iex.ec/content-creator',
  icons: [
    'https://cdn.prod.website-files.com/6646148828eddb19c172bf2a/665db3ba85a625628c353a64_Logo-RLC-Yellow.png',
  ],
};

// Connectors initialization
const connectors: CreateConnectorFn[] = [];
connectors.push(walletConnect({ projectId, metadata, showQrModal: false }));

// Injected wallet provider management
const injectedWalletProvider = new InjectedWalletProvider();
let availableProviderDetails: EIP6963ProviderDetail[] = [];

// Injected wallet provider details update
injectedWalletProvider.on('providerDetailsUpdated', () => {
  availableProviderDetails = injectedWalletProvider.providerDetails;
});
injectedWalletProvider.subscribe();
injectedWalletProvider.requestProviders();

// Preserved wallet providers IDs
const preservedId = [
  'io.metamask', // Metamask
  'com.coinbase.wallet', // Coinbase Wallet
  'com.brave.wallet', // Brave Wallet
  'walletConnect', // WalletConnect
  'io.zerion.wallet', // Zerion
];

// Filtering available providers
const preservedAvailableProviderDetails = availableProviderDetails.filter(
  (providerDetails) => preservedId.includes(providerDetails.info.rdns)
);

// Adding injected providers to connectors
preservedAvailableProviderDetails.forEach((providerDetails) => {
  connectors.push(
    injected({
      target() {
        return {
          id: providerDetails.info.rdns,
          name: providerDetails.info.name,
          icon: providerDetails.info.icon,
          provider: providerDetails.provider,
        };
      },
    })
  );
});

export const wagmiConfig = createConfig({
  chains: [bellecour],
  multiInjectedProviderDiscovery: false,
  transports: {
    [bellecour.id]: http(),
  },
  connectors,
});

// Force some wallets to be displayed even if not detected in user's browser
// Find wallets IDs here: https://explorer.walletconnect.com/
const featuredWalletIds = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // Metamask
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  '163d2cf19babf05eb8962e9748f9ebe613ed52ebf9c8107c9a0f104bfcf161b3', // Brave Wallet
  'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18', // Zerion
];

// Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  defaultChain: bellecour,
  featuredWalletIds,
  allWallets: 'HIDE',
});
