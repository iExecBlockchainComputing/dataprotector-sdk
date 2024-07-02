import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  positiveNumberSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SetProtectedDataToRentingParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataNotCurrentlyForSale,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const setProtectedDataToRenting = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData = throwIfMissing(),
  price = throwIfMissing(),
  duration = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer &
  SetProtectedDataToRentingParams): Promise<SuccessWithTransactionHash> => {
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vPrice = positiveNumberSchema()
    .required()
    .label('price')
    .validateSync(price);
  const vDuration = positiveStrictIntegerStringSchema()
    .required()
    .label('duration')
    .validateSync(duration);

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
  onlyProtectedDataNotCurrentlyForSale(protectedDataDetails);

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.setProtectedDataToRenting(
      vProtectedData,
      { price: vPrice, duration: vDuration },
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
        message: `Failed to set protected data to renting: ${e.info.error.message}`,
        errorCause: e,
      });
    }
    throw new WorkflowError({
      message: 'Failed to set protected data to renting',
      errorCause: e,
    });
  }
};
