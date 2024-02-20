import { WorkflowError } from '../../../utils/errors.js';
import { throwIfMissing } from '../../../utils/validators.js';
import type {
  Address,
  IExecConsumer,
  SharingContractConsumer,
} from '../../types/index.js';
import { getSharingContract } from './getSharingContract.js';

export async function addProtectedDataToCollection({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionTokenId,
  protectedDataAddress,
  appAddress,
}: IExecConsumer &
  SharingContractConsumer & {
    collectionTokenId: number;
    protectedDataAddress: Address;
    appAddress: Address;
  }): Promise<string> {
  const collectionContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
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
