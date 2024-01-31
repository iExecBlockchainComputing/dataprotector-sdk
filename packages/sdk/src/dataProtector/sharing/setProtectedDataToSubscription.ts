import { ethers, type Contract } from 'ethers';
import { ABI as sharingABI } from '../../contracts/sharingAbi.js';
import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  AddressOrENS,
  IExecConsumer,
  SetProtectedDataToSubscriptionParams,
  SetProtectedDataToSubscriptionResponse,
} from '../types.js';

export const setProtectedDataToSubscription = async ({
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
  iexec = throwIfMissing(),
  sharingContractAddress,
}: IExecConsumer & {
  sharingContractAddress: AddressOrENS;
} & SetProtectedDataToSubscriptionParams): Promise<SetProtectedDataToSubscriptionResponse> => {
  //TODO:Input validation
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const sharingContract = new ethers.Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );

  await (sharingContract.connect(signer) as Contract)
    .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress)
    .then((tx) => tx.wait())
    .catch((e: Error) => {
      throw new WorkflowError(
        'Failed to set ProtectedData To Subscription into sharing smart contract',
        e
      );
    });

  return {
    success: true,
  };
};
