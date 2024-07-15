import { BigNumberish, ContractTransactionResponse } from 'ethers';
import { WorkflowError } from '../../utils/errors.js';
import {
  positiveNumberSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SharingContractConsumer,
  SubscribeToCollectionParams,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getPocoContract } from './smartContract/getPocoContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getAccountDetails } from './smartContract/pocoContract.reads.js';
import {
  onlyAccountWithMinimumBalance,
  onlyCollectionAvailableForSubscription,
  onlyValidSubscriptionParams,
} from './smartContract/preflightChecks.js';
import { getCollectionDetails } from './smartContract/sharingContract.reads.js';

export const subscribeToCollection = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  collectionId,
  price,
  duration,
}: IExecConsumer &
  SharingContractConsumer &
  SubscribeToCollectionParams): Promise<SuccessWithTransactionHash> => {
  const vCollectionId = positiveNumberSchema()
    .required()
    .label('collectionId')
    .validateSync(collectionId);
  const vDuration = positiveStrictIntegerStringSchema()
    .required()
    .label('duration')
    .validateSync(duration);
  const vPrice = positiveNumberSchema()
    .required()
    .label('price')
    .validateSync(price);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const [sharingContract, pocoContract] = await Promise.all([
    getSharingContract(iexec, sharingContractAddress),
    getPocoContract(iexec),
  ]);

  //---------- Smart Contract Call ----------
  const [collectionDetails, accountDetails] = await Promise.all([
    getCollectionDetails({
      sharingContract,
      collectionId: vCollectionId,
    }),
    getAccountDetails({
      pocoContract,
      userAddress,
      sharingContractAddress,
    }),
  ]);

  //---------- Pre flight check ----------
  onlyCollectionAvailableForSubscription(collectionDetails);
  onlyValidSubscriptionParams(
    { price, duration },
    collectionDetails.subscriptionParams
  );
  onlyAccountWithMinimumBalance({
    accountDetails,
    minimumBalance: vPrice,
  });
  // TODO Check if the user is not already subscribed to the collection

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();

    let tx: ContractTransactionResponse;
    const subscribeToCollectionCallParams: [
      BigNumberish,
      {
        price: BigNumberish;
        duration: BigNumberish;
      }
    ] = [vCollectionId, { duration: vDuration, price: vPrice }];

    if (accountDetails.sharingContractAllowance >= BigInt(vPrice)) {
      tx = await sharingContract.subscribeToCollection(
        ...subscribeToCollectionCallParams,
        txOptions
      );
    } else {
      const callData = sharingContract.interface.encodeFunctionData(
        'subscribeToCollection',
        subscribeToCollectionCallParams
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
    // "User denied transaction signature"
    if (e?.info?.error?.message) {
      throw new WorkflowError({
        message: `Failed to subscribe to collection: ${e.info.error.message}`,
        errorCause: e,
      });
    }
    throw new WorkflowError({
      message: 'Sharing smart contract: Failed to subscribe to collection',
      errorCause: e,
    });
  }
};
