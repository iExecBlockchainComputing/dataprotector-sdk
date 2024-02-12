import { Transaction } from 'ethers';
import { WorkflowError } from '../../../utils/errors.js';
import type { Address } from '../../types/shared.js';
import { getSharingContract } from './getSharingContract.js';

export async function addProtectedDataToCollection({
  collectionId,
  protectedDataAddress,
  appAddress,
}: {
  collectionId: number;
  protectedDataAddress: Address;
  appAddress: Address;
}): Promise<Transaction> {
  const collectionContract = await getSharingContract();
  try {
    const tx = await collectionContract.addProtectedDataToCollection(
      collectionId,
      protectedDataAddress,
      appAddress,
      {
        // TODO: See how we can remove this
        gasLimit: 900_000,
      }
    );
    await tx.wait();
    return tx;
  } catch (err) {
    throw new WorkflowError(
      'Collection smart contract: Failed to add protected data to collection',
      err
    );
  }
}
