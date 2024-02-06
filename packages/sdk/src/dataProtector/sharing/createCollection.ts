import { WorkflowError } from '../../utils/errors.js';
import type { CreateCollectionResponse } from '../types.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const createCollection = async (): Promise<CreateCollectionResponse> => {
  const sharingContract = await getSharingContract();
  const transactionReceipt = await sharingContract
    .createCollection()
    .then((tx) => tx.wait())
    .catch((e: Error) => {
      throw new WorkflowError(
        'Failed to create collection into collection smart contract',
        e
      );
    });

  const mintedTokenId = transactionReceipt.logs.find(
    ({ eventName }) => eventName === 'Transfer'
  )?.args[2] as bigint;

  return {
    collectionId: Number(mintedTokenId),
  };
};
