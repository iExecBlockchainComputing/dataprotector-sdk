import { Contract } from 'ethers';
import { IExec } from 'iexec';
import { ABI } from '../../../../generated/abis/core/registry/ERC734.sol/ERC734.js';
import { ERC734 } from '../../../../generated/typechain/registry/ERC734.js';
import { Address } from '../../types/commonTypes.js';

export async function getWhitelistContract(
  iexec: IExec,
  contractAddress: Address
): Promise<ERC734> {
  const { signer } = await iexec.config.resolveContractsClient();
  return new Contract(contractAddress, ABI).connect(signer) as ERC734;
}
