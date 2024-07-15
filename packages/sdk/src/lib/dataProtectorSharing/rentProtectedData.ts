import { AddressLike, BigNumberish, ContractTransactionResponse } from 'ethers';
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
import { getPocoContract } from './smartContract/getPocoContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getAccountDetails } from './smartContract/pocoContract.reads.js';
import {
  onlyAccountWithMinimumBalance,
  onlyProtectedDataCurrentlyForRent,
  onlyValidRentingParams,
} from './smartContract/preflightChecks.js';
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

  const [sharingContract, pocoContract] = await Promise.all([
    getSharingContract(iexec, sharingContractAddress),
    getPocoContract(iexec),
  ]);

  //---------- Smart Contract Call ----------
  const [protectedDataDetails, accountDetails] = await Promise.all([
    getProtectedDataDetails({
      sharingContract,
      protectedData: vProtectedData,
      userAddress,
    }),
    getAccountDetails({
      pocoContract,
      userAddress,
      sharingContractAddress,
    }),
  ]);

  //---------- Pre flight check ----------
  onlyProtectedDataCurrentlyForRent(protectedDataDetails);
  onlyValidRentingParams(
    { price, duration },
    protectedDataDetails.rentingParams
  );
  onlyAccountWithMinimumBalance({
    accountDetails,
    minimumBalance: vPrice,
  });

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();

    let tx: ContractTransactionResponse;
    const rentProtectedDataCallParams: [
      AddressLike,
      {
        price: BigNumberish;
        duration: BigNumberish;
      }
    ] = [vProtectedData, { price: vPrice, duration: vDuration }];

    if (accountDetails.sharingContractAllowance >= BigInt(vPrice)) {
      tx = await sharingContract.rentProtectedData(
        ...rentProtectedDataCallParams,
        txOptions
      );
    } else {
      const callData = sharingContract.interface.encodeFunctionData(
        'rentProtectedData',
        rentProtectedDataCallParams
      );
      tx = await pocoContract.approveAndCall(
        sharingContractAddress,
        vPrice,
        callData,
        txOptions
      );
    }
    await tx.wait();

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    // Try to extract some meaningful error like:
    // "insufficient funds for transfer"
    if (e?.info?.error?.data?.message) {
      throw new WorkflowError({
        message: `Failed to rent protected data: ${e.info.error.data.message}`,
        errorCause: e,
      });
    }
    // Try to extract some meaningful error like:
    // "User denied transaction signature"
    if (e?.info?.error?.message) {
      throw new WorkflowError({
        message: `Failed to rent protected data: ${e.info.error.message}`,
        errorCause: e,
      });
    }
    throw new WorkflowError({
      message: 'Failed to rent protected data',
      errorCause: e,
    });
  }
};
