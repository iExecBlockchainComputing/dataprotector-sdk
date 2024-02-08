import { Transaction } from 'ethers';
import { DAPP_ADDRESS_FOR_CONSUMPTION } from '../../../config/config.js';
import { WorkflowError } from '../../../utils/errors.js';
import type { Address } from '../../types.js';
import { getSharingContract } from './getSharingContract.js';

export async function addProtectedDataToCollection({
  collectionId,
  protectedDataAddress,
}: {
  collectionId: number;
  protectedDataAddress: Address;
}): Promise<Transaction> {
  const collectionContract = await getSharingContract();
  try {
    const tx = await collectionContract.addProtectedDataToCollection(
      collectionId,
      protectedDataAddress,
      DAPP_ADDRESS_FOR_CONSUMPTION,
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
