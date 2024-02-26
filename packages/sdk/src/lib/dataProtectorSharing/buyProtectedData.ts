import { DEFAULT_PROTECTED_DATA_SHARING_APP } from '../../config/config.js';
import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  BuyProtectedDataParams,
  IExecConsumer,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  getCollectionForProtectedData,
  getSellingParams,
} from './smartContract/getterForSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataForSale,
} from './smartContract/preFlightCheck.js';

export async function buyProtectedData({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
  collectionTokenIdTo,
  appAddress,
}: IExecConsumer &
  SharingContractConsumer &
  BuyProtectedDataParams): Promise<SuccessWithTransactionHash> {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const vCollectionTokenIdTo = positiveNumberSchema()
    .label('collectionTokenIdTo')
    .validateSync(collectionTokenIdTo);

  const vAppAddress = addressOrEnsOrAnySchema()
    .label('appAddress')
    .validateSync(appAddress);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  await onlyProtectedDataForSale({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  try {
    let tx;
    const sellingParams = await getSellingParams({
      sharingContract,
      protectedDataAddress: vProtectedDataAddress,
    });

    if (vCollectionTokenIdTo) {
      await onlyCollectionOperator({
        sharingContract,
        collectionTokenId: vCollectionTokenIdTo,
        userAddress,
      });
      tx = await sharingContract.buyProtectedDataForCollection(
        vCollectionTokenIdTo, // _collectionTokenIdFrom
        vProtectedDataAddress,
        vCollectionTokenIdTo, // _collectionTokenIdTo
        vAppAddress || DEFAULT_PROTECTED_DATA_SHARING_APP,
        {
          value: sellingParams.price,
        }
      );
    } else {
      const collectionTokenId = await getCollectionForProtectedData({
        sharingContract,
        protectedDataAddress: vProtectedDataAddress,
      });
      tx = await sharingContract.buyProtectedData(
        collectionTokenId, // _collectionTokenIdFrom
        vProtectedDataAddress,
        userAddress,
        {
          value: sellingParams.price,
        }
      );
    }
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to buy Protected Data', e);
  }
}
