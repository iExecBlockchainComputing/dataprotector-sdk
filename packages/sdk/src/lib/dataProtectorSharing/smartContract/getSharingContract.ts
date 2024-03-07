import { IExec } from 'iexec';
import { ProtectedDataSharing__factory } from '../../../../typechain/factories/ProtectedDataSharing__factory.js';
import { ProtectedDataSharing } from '../../../../typechain/ProtectedDataSharing.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: AddressOrENS
): Promise<ProtectedDataSharing> {
  const { signer } = await iexec.config.resolveContractsClient();
  return ProtectedDataSharing__factory.connect(sharingContractAddress, signer);
}
