import { ethers } from 'ethers';
import { getPocoRegistryContract } from '../../smartContract/getPocoRegistryContract.js';
import type { Address, AddressOrENS } from '../../types.js';

export async function approveCollectionContract({
  protectedDataAddress,
  protectedDataCurrentOwnerAddress,
  collectionContractAddress,
}: {
  protectedDataAddress: Address;
  protectedDataCurrentOwnerAddress: AddressOrENS;
  collectionContractAddress: AddressOrENS;
}) {
  if (
    protectedDataCurrentOwnerAddress.toLowerCase() ===
    collectionContractAddress.toLowerCase()
  ) {
    console.log(
      '[approveCollectionContract] This protected data is already owned by the collection contract.'
    );
    return;
  }

  const protectedDataId = ethers.getBigInt(protectedDataAddress).toString();

  const registryContract = await getPocoRegistryContract();
  return registryContract
    .approve(collectionContractAddress, protectedDataId, {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => tx.wait());
}
