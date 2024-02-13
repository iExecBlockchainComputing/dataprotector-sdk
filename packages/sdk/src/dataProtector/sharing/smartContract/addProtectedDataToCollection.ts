import { Transaction } from 'ethers';
import { WorkflowError } from '../../../utils/errors.js';
import type { Address } from '../../types.js';
import { getSharingContract } from './getSharingContract.js';

export async function addProtectedDataToCollection({
  collectionTokenId,
  protectedDataAddress,
  appAddress,
}: {
  collectionTokenId: number;
  protectedDataAddress: Address;
  appAddress: Address;
}): Promise<Transaction> {
  const collectionContract = await getSharingContract();
  try {
    const tx = await collectionContract.addProtectedDataToCollection(
      collectionTokenId,
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
