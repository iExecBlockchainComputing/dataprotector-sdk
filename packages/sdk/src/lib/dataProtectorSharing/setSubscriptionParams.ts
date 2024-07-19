import { WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SetSubscriptionParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyCollectionOperator } from './smartContract/preflightChecks.js';

export const setSubscriptionParams = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionId = throwIfMissing(),
  price = throwIfMissing(),
  duration = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  SetSubscriptionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);
  const vPrice = positiveNumberSchema()
    .required()
    .label('price')
    .validateSync(price);
  const vDuration = positiveStrictIntegerStringSchema()
    .required()
    .label('duration')
    .validateSync(duration);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  await onlyCollectionOperator({
    sharingContract,
    collectionId: vCollectionId,
    userAddress,
  });

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const subscriptionParams = {
      price: vPrice,
      duration: vDuration,
    };
    const tx = await sharingContract.setSubscriptionParams(
      vCollectionId,
      subscriptionParams,
      txOptions
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    // Try to extract some meaningful error like:
    // "User denied transaction signature"
    if (e?.info?.error?.message) {
      throw new WorkflowError({
        message: `Failed to set subscription params: ${e.info.error.message}`,
        errorCause: e,
      });
    }
    throw new WorkflowError({
      message: 'Failed to set Subscription Options into sharing smart contract',
      errorCause: e,
    });
  }
};
