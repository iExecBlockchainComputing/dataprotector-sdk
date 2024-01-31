import { ethers, type Contract } from 'ethers';
import { ABI as sharingABI } from '../../contracts/sharingAbi.js';
import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  AddressOrENS,
  IExecConsumer,
  SetSubscriptionOptionsParams,
  SetSubscriptionOptionsResponse,
} from '../types.js';

export const setSubscriptionOptions = async ({
  collectionTokenId = throwIfMissing(),
  price = throwIfMissing(),
  duration = throwIfMissing(),
  iexec = throwIfMissing(),
  sharingContractAddress,
}: IExecConsumer & {
  sharingContractAddress: AddressOrENS;
} & SetSubscriptionOptionsParams): Promise<SetSubscriptionOptionsResponse> => {
  //TODO:Input validation
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const sharingContract = new ethers.Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  await (sharingContract.connect(signer) as Contract)
    .setSubscriptionParams(collectionTokenId, [price, duration])
    .then((tx) => tx.wait())
    .catch((e: Error) => {
      throw new WorkflowError(
        'Failed to set Subscription Options into sharing smart contract',
        e
      );
    });

  return {
    success: true,
  };
};
