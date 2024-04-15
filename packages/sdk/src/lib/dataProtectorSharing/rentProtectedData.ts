import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  positiveNumberSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  RentProtectedDataParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyProtectedDataCurrentlyForRent, onlyValidRentingParams } from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const rentProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData,
  price,
  duration,
}: IExecConsumer &
  SharingContractConsumer &
  RentProtectedDataParams): Promise<SuccessWithTransactionHash> => {
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vDuration = positiveStrictIntegerStringSchema()
    .required()
    .label('duration')
    .validateSync(duration);
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

  //---------- Pre flight check ----------
  onlyProtectedDataCurrentlyForRent(protectedDataDetails);
  onlyValidRentingParams(
    { price, duration },
    protectedDataDetails.rentingParams
  );
  
  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.rentProtectedData(
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
    // "insufficient funds for transfer"
    if (e?.info?.error?.data?.message) {
      throw new WorkflowError(
        `Failed to rent protected data: ${e.info.error.data.message}`,
        e
      );
    }
    // Try to extract some meaningful error like:
    // "User denied transaction signature"
    if (e?.info?.error?.message) {
      throw new WorkflowError(
        `Failed to rent protected data: ${e.info.error.message}`,
        e
      );
    }
    throw new WorkflowError('Failed to rent protected data', e);
  }
};
