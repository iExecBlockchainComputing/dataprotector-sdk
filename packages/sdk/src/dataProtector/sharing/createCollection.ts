import { ethers, type Contract } from 'ethers';
import { ABI as collectionABI } from '../../contracts/collectionAbi.js';
import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  AddressOrENS,
  CreateCollectionResponse,
  IExecConsumer,
} from '../types.js';

export const createCollection = async ({
  iexec = throwIfMissing(),
  collectionContractAddress,
}: IExecConsumer & {
  collectionContractAddress: AddressOrENS;
}): Promise<CreateCollectionResponse> => {
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const sharingContract = new ethers.Contract(
    collectionContractAddress,
    collectionABI,
    provider
  );

  const transactionReceipt = await (sharingContract.connect(signer) as Contract)
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

  return {
    collectionId: Number(mintedTokenId),
  };
};
