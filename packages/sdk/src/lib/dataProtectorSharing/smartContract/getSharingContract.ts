import { IExec } from 'iexec';
import { IProtectedDataSharing__factory } from '../../../../typechain/factories/sharing-smart-contract/artifacts/contracts/interfaces/IProtectedDataSharing__factory.js';
import { IProtectedDataSharing } from '../../../../typechain/sharing-smart-contract/artifacts/contracts/interfaces/IProtectedDataSharing.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: AddressOrENS
): Promise<IProtectedDataSharing> {
  const { signer } = await iexec.config.resolveContractsClient();
  return IProtectedDataSharing__factory.connect(sharingContractAddress, signer);
}
