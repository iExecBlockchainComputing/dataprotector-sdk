import { getSignerFromPrivateKey } from 'iexec/utils';
import { ChainId } from '../config/config.js';
import { Web3SignerProvider } from '../lib/types/index.js';

export const getWeb3Provider = (
  privateKey: string,
  options: { allowExperimentalNetworks?: boolean; host?: ChainId | string } = {}
): Web3SignerProvider => {
  const chainHost = options?.host ? `${options.host}` : 'bellecour';
  return getSignerFromPrivateKey(chainHost, privateKey, {
    allowExperimentalNetworks: options?.allowExperimentalNetworks,
    providers: {},
  });
};
