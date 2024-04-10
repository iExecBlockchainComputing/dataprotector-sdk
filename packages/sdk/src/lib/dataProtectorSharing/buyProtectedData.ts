import { DEFAULT_PROTECTED_DATA_SHARING_APP_WHITELIST } from '../../config/config.js';
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
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyCollectionOperator,
  onlyProtectedDataCurrentlyForSale,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export async function buyProtectedData({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
  collectionTokenIdTo,
  appAddress,
}: IExecConsumer &
  SharingContractConsumer &
  BuyProtectedDataParams): Promise<SuccessWithTransactionHash> {
  let vProtectedDataAddress = addressOrEnsSchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);
  const vCollectionTokenIdTo = positiveNumberSchema()
    .label('collectionTokenIdTo')
    .validateSync(collectionTokenIdTo);
  const vAppWhitelistAddress = addressSchema()
    .label('appAddress')
    .validateSync(appAddress);

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

  //---------- Pre flight check----------
  onlyProtectedDataCurrentlyForSale(protectedDataDetails);

  try {
    let tx;
    const sellingParams = protectedDataDetails.sellingParams;
    const { txOptions } = await iexec.config.resolveContractsClient();

    if (vCollectionTokenIdTo) {
      await onlyCollectionOperator({
        sharingContract,
        collectionTokenId: vCollectionTokenIdTo,
        userAddress,
      });

      tx = await sharingContract.buyProtectedDataForCollection(
        vProtectedDataAddress,
        vCollectionTokenIdTo, // _collectionTokenIdTo
        // TODO Add params: price (in order to avoid "front run")
        vAppWhitelistAddress || DEFAULT_PROTECTED_DATA_SHARING_APP_WHITELIST,
        {
          ...txOptions,
          value: sellingParams.price,
        }
      );
    } else {
      tx = await sharingContract.buyProtectedData(
        vProtectedDataAddress,
        userAddress,
        // TODO Add params: price (in order to avoid "front run")
        {
          ...txOptions,
          value: sellingParams.price,
        }
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
      throw new WorkflowError(
        `Failed to buy protected data: ${e.info.error.data.message}`,
        e
      );
    }
    // Try to extract some meaningful error like:
    // "User denied transaction signature"
    if (e?.info?.error?.message) {
      throw new WorkflowError(
        `Failed to buy protected data: ${e.info.error.message}`,
        e
      );
    }
    throw new WorkflowError('Failed to buy protected data', e);
  }
}
