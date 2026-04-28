import { AbstractProvider, AbstractSigner, Eip1193Provider } from 'ethers';
import { IExecNetworkModule } from 'iexec';

type EthersCompatibleProvider =
  | string
  | AbstractProvider
  | AbstractSigner
  | Eip1193Provider;

export async function getChainIdFromProvider(
  ethProvider: EthersCompatibleProvider
): Promise<number> {
  const networkModule = new IExecNetworkModule({
    ethProvider,
  });
  const { chainId } = await networkModule.getNetwork();
  return Number(chainId);
}
