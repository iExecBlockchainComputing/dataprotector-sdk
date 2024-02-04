import { WorkflowError } from '../../../utils/errors.js';
import type { Address } from '../../types.js';
import { getSharingContract } from './getSharingContract.js';

export async function addProtectedDataToCollection({
  collectionId,
  protectedDataAddress,
}: {
  collectionId: number;
  protectedDataAddress: Address;
}) {
  const collectionContract = await getSharingContract();
  return collectionContract
    .addProtectedDataToCollection(collectionId, protectedDataAddress, {
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => tx.wait())
    .catch((err: Error) => {
      throw new WorkflowError(
        'Collection smart contract: Failed to add protected data to collection',
        err
      );
    });
}
