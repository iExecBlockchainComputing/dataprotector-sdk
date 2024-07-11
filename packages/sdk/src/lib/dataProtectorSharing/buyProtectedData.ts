import { AddressLike, BigNumberish, ContractTransactionResponse } from 'ethers';
import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  addressSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  BuyProtectedDataParams,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { approveProtectedDataForCollectionContract } from './smartContract/approveProtectedDataForCollectionContract.js';
import { getPocoContract } from './smartContract/getPocoContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getAccountDetails } from './smartContract/pocoContract.reads.js';
import {
  onlyAccountWithMinimumBalance,
  onlyCollectionOperator,
  onlyProtectedDataCurrentlyForSale,
  onlyValidSellingParams,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export async function buyProtectedData({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData,
  price,
  addToCollectionId,
  addOnlyAppWhitelist,
}: IExecConsumer &
  SharingContractConsumer &
  BuyProtectedDataParams): Promise<SuccessWithTransactionHash> {
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vAddToCollectionId = positiveNumberSchema()
    .label('addToCollectionId')
    .validateSync(addToCollectionId);
  const vAddOnlyAppWhitelist = addressSchema()
    .label('addOnlyAppWhitelist')
    .validateSync(addOnlyAppWhitelist);
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

  //---------- Pre flight check----------
  onlyProtectedDataCurrentlyForSale(protectedDataDetails);
  onlyValidSellingParams(vPrice, protectedDataDetails.sellingParams.price);
  onlyAccountWithMinimumBalance({
    accountDetails,
    minimumBalance: vPrice,
  });

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();

    let tx: ContractTransactionResponse;
    const buyProtectedDataCallParams: [AddressLike, AddressLike, BigNumberish] =
      [vProtectedData, userAddress, vPrice];
    if (accountDetails.sharingContractAllowance >= BigInt(vPrice)) {
      tx = await sharingContract.buyProtectedData(
        ...buyProtectedDataCallParams,
        txOptions
      );
    } else {
      const callData = sharingContract.interface.encodeFunctionData(
        'buyProtectedData',
        buyProtectedDataCallParams
      );
      tx = await pocoContract.approveAndCall(
        sharingContractAddress,
        vPrice,
        callData,
        txOptions
      );
    }
    await tx.wait();

    if (vAddToCollectionId) {
      await onlyCollectionOperator({
        sharingContract,
        collectionId: vAddToCollectionId,
        userAddress,
      });

      // should implement multicall in the future (not compatible with approveAndCall)
      await approveProtectedDataForCollectionContract({
        iexec,
        protectedData: vProtectedData,
        sharingContractAddress,
      });

      const txAddToCollection =
        await sharingContract.addProtectedDataToCollection(
          vAddToCollectionId, // _collectionTokenIdTo
          vProtectedData,
          vAddOnlyAppWhitelist,
          txOptions
        );
      await txAddToCollection.wait();
    }

    return {
      txHash: tx.hash,
    };
  } catch (e) {
    // Try to extract some meaningful error like:
    // "insufficient funds for transfer"
    if (e?.info?.error?.data?.message) {
      throw new WorkflowError({
        message: `Failed to buy protected data: ${e.info.error.data.message}`,
        errorCause: e,
      });
    }
    // Try to extract some meaningful error like:
    // "User denied transaction signature"
    if (e?.info?.error?.message) {
      throw new WorkflowError({
        message: `Failed to buy protected data: ${e.info.error.message}`,
        errorCause: e,
      });
    }
    throw new WorkflowError({
      message: 'Failed to buy protected data',
      errorCause: e,
    });
  }
}
