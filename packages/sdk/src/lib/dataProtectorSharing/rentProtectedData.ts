import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { addressOrEnsSchema, throwIfMissing } from '../../utils/validators.js';
import {
  RentProtectedDataParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyProtectedDataCurrentlyForRent } from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const rentProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
}: IExecConsumer &
  SharingContractConsumer &
  RentProtectedDataParams): Promise<SuccessWithTransactionHash> => {
  let vProtectedDataAddress = addressOrEnsSchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  // ENS resolution if needed
  vProtectedDataAddress = await resolveENS(iexec, vProtectedDataAddress);

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
    userAddress,
  });

  //---------- Pre flight check ----------
  onlyProtectedDataCurrentlyForRent(protectedDataDetails);

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.rentProtectedData(vProtectedDataAddress, {
      ...txOptions,
      value: protectedDataDetails.rentingParams.price,
      // TODO Add params: price and duration (in order to avoid "front run")
    });
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    // Trying to extract some meaningful error like:
    // "insufficient funds for transfer"
    if (e?.info?.error?.data?.message) {
      throw new WorkflowError(
        `Failed to rent protected data: ${e.info.error.data.message}`,
        e
      );
    }
    // Trying to extract some meaningful error like:
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
