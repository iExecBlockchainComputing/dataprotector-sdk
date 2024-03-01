import { Address } from 'iexec';
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
import {
  getSharingContract,
  type SharingContract,
} from './smartContract/getSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataNotRented,
} from './smartContract/preflightChecks.js';
import {
  getProtectedDataDetails,
  ProtectedDataDetails,
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

  const protectedData = await getProtectedData({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
  });

  await onlyCollectionOperator({
    sharingContract,
    collectionTokenId: protectedData.collectionTokenId,
    userAddress,
  });

  await checkProtectedData({
    sharingContract,
    protectedData,
    protectedDataAddress: vProtectedDataAddress,
  });

  try {
    const tx = await sharingContract.setProtectedDataForSale(
      protectedData.collectionTokenId,
      vProtectedDataAddress,
      vPriceInNRLC
    );
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set protected data for sale',
      e as Error | undefined
    );
  }
};

async function getProtectedData({
  sharingContract,
  protectedDataAddress,
}: {
  sharingContract: SharingContract;
  protectedDataAddress: Address;
}) {
  const protectedData = await getProtectedDataDetails({
    sharingContract,
    protectedDataAddress,
  });
  if (!protectedData) {
    throw new ErrorWithData(
      'This protected data does not seem to exist or it has been burned.',
      {
        protectedDataAddress,
      }
    );
  }
  return protectedData;
}

async function checkProtectedData({
  sharingContract,
  protectedData,
  protectedDataAddress,
}: {
  sharingContract: SharingContract;
  protectedData: ProtectedDataDetails;
  protectedDataAddress: Address;
}) {
  await onlyProtectedDataNotRented({
    sharingContract,
    protectedData,
    protectedDataAddress,
  });

  if (protectedData.isIncludedInSubscription) {
    throw new ErrorWithData(
      'This protected data is currently included in your subscription. First call removeProtectedDataFromSubscription()',
      {
        protectedDataAddress,
      }
    );
  }

  if (protectedData.rentingParams) {
    throw new ErrorWithData(
      'This protected data is currently for rent. First call removeProtectedDataFromRenting()',
      {
        protectedDataAddress,
      }
    );
  }
}
