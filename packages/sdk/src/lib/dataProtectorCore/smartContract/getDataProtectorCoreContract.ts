import { Contract } from 'ethers';
import { IExec } from 'iexec';
import { ABI } from '../../../../generated/abis/core/interfaces/IDataProtector.sol/IDataProtector.js';
import { IDataProtector } from '../../../../generated/typechain/core/interfaces/IDataProtector.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getDataProtectorCoreContract(
  iexec: IExec,
  contractAddress: AddressOrENS
): Promise<IDataProtector> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(contractAddress, ABI).connect(signer) as IDataProtector;
}
