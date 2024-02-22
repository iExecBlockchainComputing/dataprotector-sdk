import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import type {
  CreateCollectionResponse,
  IExecConsumer,
  SharingContractConsumer,
} from '../types/index.js';
import { waitForSubgraphIndexing } from '../utils/waitForSubgraphIndexing.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const createCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer): Promise<CreateCollectionResponse> => {
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
  try {
    const tx = await sharingContract.createCollection();
    const txReceipt = await tx.wait();

    const mintedTokenId = txReceipt.logs.find(
      ({ eventName }) => eventName === 'Transfer'
    )?.args[2] as bigint;

    // Be sure that collection has been indexed in the subgraph before returning
    // TODO: If we keep this here, move this waitForSubgraphIndexing() to 'src' instead of 'tests'
    await waitForSubgraphIndexing();

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
};
