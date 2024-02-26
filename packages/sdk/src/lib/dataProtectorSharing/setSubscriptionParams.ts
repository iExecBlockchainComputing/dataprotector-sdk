import { WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  SetSubscriptionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyCollectionOperator } from './smartContract/preFlightCheck.js';

export const setSubscriptionParams = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  SetSubscriptionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionTokenId = positiveNumberSchema()
    .required()
    .label('collectionTokenId')
    .validateSync(collectionTokenId);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: vCollectionTokenId,
    userAddress,
  });

  try {
    const tx = await sharingContract.setSubscriptionParams(vCollectionTokenId, [
      priceInNRLC.toLocaleString(),
      durationInSeconds,
    ]);
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set Subscription Options into sharing smart contract',
      e
    );
  }
};
