import { AbstractProvider, AbstractSigner, Eip1193Provider } from 'ethers';
import { IExecNetworkModule } from 'iexec';
import { DEFAULT_CHAIN_ID } from '../config/config.js';

type EthersCompatibleProvider =
  | string
  | AbstractProvider
  | AbstractSigner
  | Eip1193Provider;

export async function getChainIdFromProvider(
  ethProvider: EthersCompatibleProvider
): Promise<number> {
  try {
    const networkModule = new IExecNetworkModule({
      ethProvider,
    });
    const { chainId } = await networkModule.getNetwork();
    return Number(chainId);
  } catch (e) {
    console.warn('Failed to detect chainId:', e);
  }
  return DEFAULT_CHAIN_ID;
}
