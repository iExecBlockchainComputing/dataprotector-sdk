import { ethers } from 'ethers';
import type { IExec } from 'iexec';
import { getPocoRegistryContract } from '../../smartContract/getPocoRegistryContract.js';
import type { Address, AddressOrENS } from '../../types/index.js';

export async function approveCollectionContract({
  iexec,
  protectedDataAddress,
  protectedDataCurrentOwnerAddress,
  sharingContractAddress,
}: {
  iexec: IExec;
  protectedDataAddress: Address;
  protectedDataCurrentOwnerAddress: AddressOrENS;
  sharingContractAddress: AddressOrENS;
}) {
  if (
    protectedDataCurrentOwnerAddress.toLowerCase() ===
    sharingContractAddress.toLowerCase()
  ) {
    console.log(
      '[approveCollectionContract] This protected data is already owned by the collection contract.'
    );
    return;
  }

  const protectedDataId = ethers.getBigInt(protectedDataAddress).toString();

  const registryContract = await getPocoRegistryContract(iexec);
  return registryContract
    .approve(sharingContractAddress, protectedDataId, {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => tx.wait());
}
