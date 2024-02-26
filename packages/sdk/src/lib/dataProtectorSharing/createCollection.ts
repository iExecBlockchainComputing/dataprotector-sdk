import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import type {
  CreateCollectionResponse,
  IExecConsumer,
  SharingContractConsumer,
} from '../types/index.js';
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
    const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
    const tx = await sharingContract.createCollection(userAddress);
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
};
