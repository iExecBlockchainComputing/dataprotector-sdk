import { ethers, type Contract } from 'ethers';
import { ABI as sharingABI } from '../../contracts/sharingAbi.js';
import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  AddressOrENS,
  IExecConsumer,
  SetSubscriptionParams,
  SetSubscriptionParamsResponse,
} from '../types.js';

export const setSubscriptionParams = async ({
  iexec = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
  sharingContractAddress,
}: IExecConsumer & {
  sharingContractAddress: AddressOrENS;
} & SetSubscriptionParams): Promise<SetSubscriptionParamsResponse> => {
  //TODO:Input validation
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const sharingContract = new ethers.Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  try {
    const tx = await (
      sharingContract.connect(signer) as Contract
    ).setSubscriptionParams(collectionTokenId, [
      priceInNRLC,
      durationInSeconds,
    ]);
    await tx.wait();

    return {
      transaction: tx,
      success: true,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set Subscription Options into sharing smart contract',
      e
    );
  }
};
