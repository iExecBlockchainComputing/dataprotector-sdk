import { Contract } from 'ethers';
import { IExec } from 'iexec';
import { DataProtector } from '../../../../typechain/smart-contract/artifacts/contracts/DataProtector.js';
import { ABI } from '../../../contracts/DataProtectorABI.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getContract(
  iexec: IExec,
  contractAddress: AddressOrENS
): Promise<DataProtector> {
  const { signer } = await iexec.config.resolveContractsClient();

  return new Contract(contractAddress, ABI, signer) as unknown as DataProtector;
}
