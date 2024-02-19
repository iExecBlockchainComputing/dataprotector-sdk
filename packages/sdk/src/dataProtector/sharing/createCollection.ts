import { WorkflowError } from '../../utils/errors.js';
import type { CreateCollectionResponse } from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export async function createCollection(): Promise<CreateCollectionResponse> {
  const sharingContract = await getSharingContract(
    this.iexec,
    this.sharingContractAddress
  );
  try {
    const tx = await sharingContract.createCollection();
    const txReceipt = await tx.wait();

    const mintedTokenId = txReceipt.logs.find(
      ({ eventName }) => eventName === 'Transfer'
    )?.args[2] as bigint;

    return {
      collectionTokenId: Number(mintedTokenId),
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to create collection into collection smart contract',
      e
    );
  }
}
