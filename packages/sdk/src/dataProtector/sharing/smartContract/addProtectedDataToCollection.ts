import { WorkflowError } from '../../../utils/errors.js';
import type { Address } from '../../types/index.js';
import { getSharingContract } from './getSharingContract.js';

export async function addProtectedDataToCollection({
  collectionTokenId,
  protectedDataAddress,
  appAddress,
}: {
  collectionTokenId: number;
  protectedDataAddress: Address;
  appAddress: Address;
}): Promise<string> {
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
    const txReceipt = await tx.wait();
    return txReceipt.hash;
  } catch (err) {
    throw new WorkflowError(
      'Collection smart contract: Failed to add protected data to collection',
      err
    );
  }
}
