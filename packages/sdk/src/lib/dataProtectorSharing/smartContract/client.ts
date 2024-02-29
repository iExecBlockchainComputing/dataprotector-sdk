import { Chain, createPublicClient, createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const rpcURL = 'https://bellecour.iex.ec';

export const bellecour = {
  id: 0x86,
  name: 'iExec Sidechain',
  nativeCurrency: {
    decimals: 18,
    name: 'xRLC',
    symbol: 'xRLC',
  },
  rpcUrls: {
    public: { http: [rpcURL] },
    default: { http: [rpcURL] },
  },
  blockExplorers: {
    etherscan: {
      name: 'Blockscout',
      url: 'https://blockscout-bellecour.iex.ec',
    },
    default: { name: 'Blockscout', url: 'https://blockscout-bellecour.iex.ec' },
  },
} as const satisfies Chain;

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const walletClient = createWalletClient({
  account: privateKeyToAccount('0x…'),
  chain: bellecour,
  transport: http(),
});
