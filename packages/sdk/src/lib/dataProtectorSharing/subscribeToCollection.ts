import { WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SharingContractConsumer,
  SubscribeToCollectionParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyCollectionAvailableForSubscription } from './smartContract/preflightChecks.js';
import { getCollectionDetails } from './smartContract/sharingContract.reads.js';

export const subscribeToCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionId,
  duration,
}: IExecConsumer &
  SharingContractConsumer &
  SubscribeToCollectionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);
  const vDuration = positiveNumberSchema()
    .required()
    .label('duration')
    .validateSync(duration);

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

  // TODO Check if the user is not already subscribed to the collection

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.subscribeTo(
      vCollectionId,
      // TODO Add param: price (in order to avoid "front run")
      vDuration,
      {
        value: collectionDetails.subscriptionParams.price,
        ...txOptions,
      }
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Sharing smart contract: Failed to subscribe to collection',
      e
    );
  }
};
