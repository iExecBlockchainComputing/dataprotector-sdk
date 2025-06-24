import { getSignerFromPrivateKey } from 'iexec/utils';
import { ChainId, getChainConfig } from '../config/config.js';
import { Web3SignerProvider } from '../lib/types/index.js';

export const getWeb3Provider = (
  privateKey: string,
  chainId: ChainId = 134,
  options?: { allowExperimentalNetworks?: boolean }
): Web3SignerProvider => {
  const { name } = getChainConfig(chainId, {
    allowExperimentalNetworks: options?.allowExperimentalNetworks,
  });
  if (!name) {
    throw Error('Unsupported Network');
  }
  return getSignerFromPrivateKey(name, privateKey, {
    allowExperimentalNetworks: options?.allowExperimentalNetworks,
    providers: {},
  });
};
