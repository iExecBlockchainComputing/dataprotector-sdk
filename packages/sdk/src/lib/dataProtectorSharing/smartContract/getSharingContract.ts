import { IExec } from 'iexec';
import {
  ProtectedDataSharing,
  ProtectedDataSharing__factory as ProtectedDataSharingFactory,
} from '../../../../typechain/index.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: AddressOrENS
): Promise<ProtectedDataSharing> {
  const { signer } = await iexec.config.resolveContractsClient();
  return ProtectedDataSharingFactory.connect(sharingContractAddress, signer);
}
