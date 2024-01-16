import { ethers, type Contract } from 'ethers';
import { ABI as sharingABI } from '../../contracts/sharingAbi.js';
import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import { AddressOrENS, IExecConsumer } from '../types.js';

export type CreateCollectionResponse = {
  collectionId: AddressOrENS;
};

export const createCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress,
}: IExecConsumer & {
  sharingContractAddress: AddressOrENS;
}): Promise<CreateCollectionResponse> => {
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const sharingContract = new ethers.Contract(
    sharingContractAddress,
    sharingABI,
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
  )?.args[2];

  return {
    collectionId: mintedTokenId
  }
};
