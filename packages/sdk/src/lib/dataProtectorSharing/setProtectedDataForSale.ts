import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  SetProtectedDataForSaleParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  getCollectionForProtectedData,
  getRentingParams,
  isInSubscription,
} from './smartContract/getterForSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataInCollection,
  onlyProtectedDataNotRented,
} from './smartContract/preflightChecks.js';

export const setProtectedDataForSale = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
  priceInNRLC,
}: IExecConsumer &
  SharingContractConsumer &
  SetProtectedDataForSaleParams): Promise<SuccessWithTransactionHash> => {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const vPriceInNRLC = positiveNumberSchema()
    .required()
    .label('priceInNRLC')
    .validateSync(priceInNRLC);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  const collectionTokenId = await getCollectionForProtectedData({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId,
    userAddress,
  });
  await onlyProtectedDataInCollection({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  await onlyProtectedDataNotRented({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  try {
    const isIncludedInSubscription = await isInSubscription({
      sharingContract,
      protectedDataAddress: vProtectedDataAddress,
    });
    if (isIncludedInSubscription) {
      // TODO: Create removeProtectedDataFromSubscription() method
      throw new ErrorWithData(
        'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()',
        {
          protectedDataAddress,
        }
      );
    }

    const rentingParams = await getRentingParams({
      sharingContract,
      protectedDataAddress: vProtectedDataAddress,
    });
    if (rentingParams.duration > 0) {
      throw new ErrorWithData(
        'This protected data is currently for rent. First call removeProtectedDataFromRenting()',
        {
          protectedDataAddress,
        }
      );
    }

    const tx = await sharingContract.setProtectedDataForSale(
      collectionTokenId,
      vProtectedDataAddress,
      vPriceInNRLC
    );
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to set protected data for sale', e);
  }
};
