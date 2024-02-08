import { WorkflowError } from '../../utils/errors.js';
import { positiveNumberSchema } from '../../utils/validators.js';
import {
  AddressOrENS,
  IExecConsumer,
  SubscribeParams,
  SubscribeResponse,
} from '../types.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const subscribe = async ({
  collectionId,
}: IExecConsumer & {
  sharingContractAddress: AddressOrENS;
} & SubscribeParams): Promise<SubscribeResponse> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);

  const sharingContract = await getSharingContract();
  const subscriptionParams = await sharingContract.subscriptionParams(
    vCollectionId
  );
  const price = subscriptionParams.price;
  await sharingContract
    .subscribeTo(vCollectionId, {
      value: price,
      // TODO: See how we can remove this
      gasLimit: 900_000,
    })
    .then((tx) => tx.wait())
    .catch((err: Error) => {
      throw new WorkflowError(
        'Sharing smart contract: Failed to subscribe to collection',
        err
      );
    });
  return {
    success: true,
  };
};
