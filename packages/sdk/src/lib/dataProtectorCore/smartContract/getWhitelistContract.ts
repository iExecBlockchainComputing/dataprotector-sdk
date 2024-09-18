import { Contract } from 'ethers';
import { IExec } from 'iexec';
import { ABI } from '../../../../generated/abis/sharing/registry/ERC734.sol/ERC734.js';
import { ERC734 } from '../../../../generated/typechain/sharing/registry/ERC734.js';
import { AddressOrENS } from '../../types/commonTypes.js';

export async function getWhitelistContract(
  iexec: IExec,
  contractAddress: AddressOrENS
): Promise<ERC734> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(contractAddress, ABI).connect(signer) as ERC734;
}
