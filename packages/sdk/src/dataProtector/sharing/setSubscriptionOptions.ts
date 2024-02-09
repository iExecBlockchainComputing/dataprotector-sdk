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
  iexec = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
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
    .setSubscriptionParams(collectionTokenId, [
      priceInNRLC.toLocaleString(),
      durationInSeconds,
    ])
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
