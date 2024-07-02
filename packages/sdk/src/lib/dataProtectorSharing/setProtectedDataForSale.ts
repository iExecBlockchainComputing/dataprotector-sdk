import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SetProtectedDataForSaleParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyProtectedDataNotIncludedInSubscription,
  onlyCollectionOperator,
  onlyProtectedDataNotCurrentlyForRent,
  onlyProtectedDataNotRented,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const setProtectedDataForSale = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData,
  price,
}: IExecConsumer &
  SharingContractConsumer &
  SetProtectedDataForSaleParams): Promise<SuccessWithTransactionHash> => {
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vPrice = positiveNumberSchema()
    .required()
    .label('price')
    .validateSync(price);

  // ENS resolution if needed
  vProtectedData = await resolveENS(iexec, vProtectedData);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  const protectedDataDetails = await getProtectedDataDetails({
    sharingContract,
    protectedData: vProtectedData,
    userAddress,
  });
  await onlyCollectionOperator({
    sharingContract,
    collectionId: Number(protectedDataDetails.collection.collectionId),
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyProtectedDataNotRented(protectedDataDetails);
  onlyProtectedDataNotCurrentlyForRent(protectedDataDetails);
  onlyProtectedDataNotIncludedInSubscription(protectedDataDetails);

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.setProtectedDataForSale(
      vProtectedData,
      vPrice,
      txOptions
    );
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to set protected data for sale',
      errorCause: e,
    });
  }
};
