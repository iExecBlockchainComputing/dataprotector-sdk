import { IExec } from 'iexec';
import { IDataProtector__factory } from '../../../../typechain/factories/smart-contract/artifacts/contracts/interfaces/IDataProtector__factory.js';
import { IDataProtector } from '../../../../typechain/smart-contract/artifacts/contracts/interfaces/IDataProtector.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getContract(
  iexec: IExec,
  contractAddress: AddressOrENS
): Promise<IDataProtector> {
  const { signer } = await iexec.config.resolveContractsClient();
  return IDataProtector__factory.connect(contractAddress, signer);
}
