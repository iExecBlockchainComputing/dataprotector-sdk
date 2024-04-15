import { WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SharingContractConsumer,
  SubscribeToCollectionParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyCollectionAvailableForSubscription,
  onlyValidSubscriptionParams,
} from './smartContract/preflightChecks.js';
import { getCollectionDetails } from './smartContract/sharingContract.reads.js';

export const subscribeToCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionId,
  duration,
  price,
}: IExecConsumer &
  SharingContractConsumer &
  SubscribeToCollectionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);
  const vDuration = positiveStrictIntegerStringSchema()
    .required()
    .label('duration')
    .validateSync(duration);
  const vPrice = positiveNumberSchema()
    .required()
    .label('price')
    .validateSync(price);

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  const collectionDetails = await getCollectionDetails({
    sharingContract,
    collectionId: vCollectionId,
  });

  //---------- Pre flight check ----------
  onlyCollectionAvailableForSubscription(collectionDetails);
  onlyValidSubscriptionParams(
    { price, duration },
    collectionDetails.subscriptionParams
  );
  // TODO Check if the user is not already subscribed to the collection

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.subscribeToCollection(
      vCollectionId,
      { duration: vDuration, price: vPrice },
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
      throw new WorkflowError(
        `Failed to subscribe to collection: ${e.info.error.message}`,
        e
      );
    }
    throw new WorkflowError(
      'Sharing smart contract: Failed to subscribe to collection',
      e
    );
  }
};
