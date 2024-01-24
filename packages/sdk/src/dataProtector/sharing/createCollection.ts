import { type Contract } from 'ethers';
import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  AddressOrENS,
  IExecConsumer,
  CreateCollectionResponse,
} from '../types.js';
import { getCollectionContract } from './smartContract/getCollectionContract.js';

export const createCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress,
}: IExecConsumer & {
  sharingContractAddress: AddressOrENS;
}): Promise<CreateCollectionResponse> => {
  console.log('-> createCollection');
  const { provider, signer } = await iexec.config.resolveContractsClient();

  // Get collection contract from store SC
  const { collectionContract } = await getCollectionContract({
    provider,
    sharingContractAddress,
  });

  const transactionReceipt = await (
    collectionContract.connect(signer) as Contract
  )
    .createCollection()
    .then((tx) => tx.wait())
    .catch((e: Error) => {
      throw new WorkflowError(
        'Failed to create collection into sharing smart contract',
        e
      );
    });

  const mintedTokenId = transactionReceipt.logs.find(
    ({ eventName }) => eventName === 'Transfer'
  )?.args[2] as bigint;
  console.log('mintedTokenId', mintedTokenId, Number(mintedTokenId));

  return {
    collectionId: Number(mintedTokenId),
  };
};
