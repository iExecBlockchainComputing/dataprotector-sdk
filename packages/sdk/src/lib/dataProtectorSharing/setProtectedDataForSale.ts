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
  onlyCollectionOperator,
  onlyProtectedDataNotRented,
} from './smartContract/preflightChecks.js';
import {
  getProtectedDataDetails,
  getRentingParams,
} from './smartContract/sharingContract.reads.js';

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

  //---------- Smart Contract Call ----------
  const protectedDataDetails = await getProtectedDataDetails({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });
  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: Number(protectedDataDetails.collection),
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyProtectedDataNotRented(protectedDataDetails);

  try {
    if (protectedDataDetails.inSubscription) {
      throw new ErrorWithData(
        'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()',
        {
          protectedDataAddress,
        }
      );
    }

    const rentingParams = getRentingParams(protectedDataDetails);
    if (rentingParams.duration > 0) {
      throw new ErrorWithData(
        'This protected data is currently for rent. First call removeProtectedDataFromRenting()',
        {
          protectedDataAddress,
        }
      );
    }

    const tx = await sharingContract.setProtectedDataForSale(
      protectedDataDetails.collection,
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
