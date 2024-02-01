import { Contract } from 'ethers';
import type { IExec } from 'iexec';
import { ABI as collectionABI } from '../../../contracts/collectionAbi.js';
import type { AddressOrENS } from '../../types.js';

let iexec: IExec;
let collectionContractAddress: AddressOrENS;

export function saveForCollectionContract(
  iexecRef: IExec,
  contractAddress: AddressOrENS
) {
  iexec = iexecRef;
  collectionContractAddress = contractAddress;
}

export async function getCollectionContract() {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const collectionContract = new Contract(
    collectionContractAddress,
    collectionABI,
    provider
  );
  return collectionContract.connect(signer) as Contract;
}
