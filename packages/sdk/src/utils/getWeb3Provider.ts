import { getSignerFromPrivateKey } from 'iexec/utils';
import { ChainId } from '../config/config.js';
import { Web3SignerProvider } from '../lib/types/index.js';

export const getWeb3Provider = (
  privateKey: string,
  host: ChainId | string,
  options: { allowExperimentalNetworks?: boolean } = {}
): Web3SignerProvider => {
  return getSignerFromPrivateKey(`${host}`, privateKey, {
    allowExperimentalNetworks: options?.allowExperimentalNetworks,
    providers: {},
  });
};
