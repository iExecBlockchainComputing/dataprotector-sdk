import { http } from 'viem';
import { mainnet } from 'viem/chains';
import { createEnsPublicClient } from '@ensdomains/ensjs';
import { Address } from 'wagmi';

/**
 * Docs: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
 */

const ensClient = createEnsPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function getEnsForAddress(address: Address) {
  let ensName = await ensClient.getName({
    address: address,
  });
  if (
    ensName == null ||
    address != (await ensClient.name(ensName).getAddress())
  ) {
    ensName = null;
  }
  return ensName;
}
