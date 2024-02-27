import { ethers } from 'ethers';
import { ErrorWithData } from '../../../utils/errors.js';
import { throwIfMissing } from '../../../utils/validators.js';
import type { Address, IExecConsumer } from '../../types/index.js';
import { getPocoDatasetRegistryContract } from './getPocoRegistryContract.js';

export async function approveCollectionContract({
  iexec = throwIfMissing(),
  protectedDataAddress,
  sharingContractAddress,
}: IExecConsumer & {
  protectedDataAddress: Address;
  sharingContractAddress: Address;
}) {
  const pocoProtectedDataRegistryContract =
    await getPocoDatasetRegistryContract(iexec);
  const protectedDataTokenId = ethers
    .getBigInt(protectedDataAddress)
    .toString();

  const approvedOperator = await pocoProtectedDataRegistryContract
    .getApproved(protectedDataTokenId)
    .catch(() => {
      throw new ErrorWithData(
        'This protected data does not seem to exist or it has been burned.',
        {
          protectedDataAddress,
        }
      );
    });

  if (approvedOperator.toLowerCase() !== sharingContractAddress) {
    const registryContract = await getPocoDatasetRegistryContract(iexec);
    return registryContract
      .approve(sharingContractAddress, protectedDataTokenId)
      .then((tx) => tx.wait());
  }
}
