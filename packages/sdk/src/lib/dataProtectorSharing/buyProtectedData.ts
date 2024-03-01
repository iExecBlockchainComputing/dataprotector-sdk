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
  onlyCollectionOperator,
  onlyProtectedDataForSale,
  onlyCollectionNotMine,
} from './smartContract/preflightChecks.js';
import {
  getCollectionForProtectedData,
  getSellingParams,
} from './smartContract/sharingContract.reads.js';

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

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  await onlyProtectedDataForSale({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  const collectionTokenId = await getCollectionForProtectedData({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  await onlyCollectionNotMine({
    sharingContract,
    collectionTokenId,
    userAddress,
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
        collectionTokenId, // _collectionTokenIdFrom
        vProtectedDataAddress,
        vCollectionTokenIdTo, // _collectionTokenIdTo
        vAppAddress || DEFAULT_PROTECTED_DATA_SHARING_APP,
        {
          value: sellingParams.price,
        }
      );
    } else {
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
    throw new WorkflowError('Failed to buy protected data', e);
  }
}
