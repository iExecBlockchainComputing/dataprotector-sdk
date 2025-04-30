import {
  JsonRpcProvider,
  BrowserProvider,
  AbstractProvider,
  AbstractSigner,
  Eip1193Provider
} from 'ethers';
import { DEFAULT_CHAIN_ID } from '../config/config.js';

type EthersCompatibleProvider =
  | string
  | AbstractProvider
  | AbstractSigner
  | Eip1193Provider;

export async function getChainIdFromProvider(ethProvider: EthersCompatibleProvider): Promise<number> {
  try {
    if (typeof ethProvider === 'string') {
      const provider = new JsonRpcProvider(ethProvider);
      const network = await provider.getNetwork();
      return Number(network.chainId);
    } else if ('request' in ethProvider) {
      const provider = new BrowserProvider(ethProvider as Eip1193Provider);
      const network = await provider.getNetwork();
      return Number(network.chainId);
    } else if ('getNetwork' in ethProvider) {
      const network = await (ethProvider as AbstractProvider).getNetwork();
      return Number(network.chainId);
    }
  } catch (e) {
    console.warn('Failed to detect chainId:', e);
  }
  return DEFAULT_CHAIN_ID;
}
