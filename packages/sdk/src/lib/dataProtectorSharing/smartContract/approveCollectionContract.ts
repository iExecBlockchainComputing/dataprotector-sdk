import { ethers } from 'ethers';
import { throwIfMissing } from '../../../utils/validators.js';
import type {
  Address,
  AddressOrENS,
  IExecConsumer,
} from '../../types/index.js';
import { getPocoDatasetRegistryContract } from './getPocoRegistryContract.js';

export async function approveCollectionContract({
  iexec = throwIfMissing(),
  protectedDataAddress,
  protectedDataCurrentOwnerAddress,
  sharingContractAddress,
}: IExecConsumer & {
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

  const registryContract = await getPocoDatasetRegistryContract(iexec);
  return registryContract
    .approve(sharingContractAddress, protectedDataId, {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => tx.wait());
}
