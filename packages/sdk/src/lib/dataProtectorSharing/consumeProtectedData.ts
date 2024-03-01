import { ethers } from 'ethers';
import { SCONE_TAG, WORKERPOOL_ADDRESS } from '../../config/config.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import { generateKeyPair } from '../../utils/rsa.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  ConsumeProtectedDataParams,
  ConsumeProtectedDataResponse,
  IExecConsumer,
  SharingContractConsumer,
} from '../types/index.js';
import { getPocoAppRegistryContract } from './smartContract/getPocoRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyCollectionNotMine } from './smartContract/preflightChecks.js';
import {
  getProtectedDataDetails,
  getRentalExpiration,
  getSubscriberExpiration,
} from './smartContract/sharingContract.reads.js';

export const consumeProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
  onStatusUpdate = () => {},
}: IExecConsumer &
  SharingContractConsumer &
  ConsumeProtectedDataParams): Promise<ConsumeProtectedDataResponse> => {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

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

  //---------- Pre flight check----------
  onlyCollectionNotMine({
    collectionOwner: protectedDataDetails.collectionOwner,
    userAddress,
  });

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const rentingExpiration = await getRentalExpiration({
    sharingContract,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });
  const hasRentalExpired = rentingExpiration < currentTimestamp;

  const subscriptionExpiration = await getSubscriberExpiration({
    sharingContract,
    collectionTokenId: protectedDataDetails.collection,
    userAddress,
  });
  const isNotInSubscribed =
    !protectedDataDetails.inSubscription ||
    subscriptionExpiration < currentTimestamp;

  if (hasRentalExpired && isNotInSubscribed) {
    throw new ErrorWithData(
      "You are not allowed to consume this protected data. You need to rent it first, or to subscribe to the user's collection.",
      {
        collectionId: protectedDataDetails.collection,
      }
    );
  }

  try {
    // get the app set to consume the protectedData
    const appAddress = protectedDataDetails.app;

    const pocoAppRegistryContract = await getPocoAppRegistryContract(iexec);
    const appTokenId = ethers.getBigInt(appAddress).toString();
    let appOwner = await pocoAppRegistryContract.ownerOf(appTokenId);
    appOwner = appOwner.toLowerCase();
    if (appOwner !== sharingContractAddress) {
      throw new WorkflowError(
        'The app related to the protected data is not owned by the DataProtector Sharing contract'
      );
    }

    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: WORKERPOOL_ADDRESS,
      app: appAddress,
      dataset: vProtectedDataAddress,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
    });
    const workerpoolOrder = workerpoolOrderbook.orders[0]?.order;
    if (workerpoolOrder.workerpoolprice > 0) {
      throw new WorkflowError(
        'Could not find a free workerpool order, maybe too many requests? You might want to try again later.'
      );
    }

    const { publicKey, privateKey } = await generateKeyPair();
    await iexec.result.pushResultEncryptionKey(publicKey, {
      forceUpdate: true,
    });

    // Make a deal
    onStatusUpdate({
      title: 'CONSUME_PROTECTED_DATA',
      isDone: false,
    });
    const contentPath = '';
    const tx = await sharingContract.consumeProtectedData(
      protectedDataDetails.collection,
      vProtectedDataAddress,
      workerpoolOrder,
      contentPath
    );
    const txReceipt = await tx.wait();
    onStatusUpdate({
      title: 'CONSUME_PROTECTED_DATA',
      isDone: true,
    });

    // TODO: Uncomment when IPFS storage token is released
    // Get the result IPFS link
    onStatusUpdate({
      title: 'UPLOAD_RESULT_TO_IPFS',
      isDone: false,
    });
    const eventFilter = sharingContract.filters.ProtectedDataConsumed();
    const events = await sharingContract.queryFilter(
      eventFilter,
      txReceipt.blockNumber,
      txReceipt.blockNumber
    );
    const specificEventForPreviousTx = events.find(
      (event) => event.transactionHash === tx.hash
    );
    if (!specificEventForPreviousTx) {
      throw new Error('No matching event found for this transaction');
    }

    const dealId = specificEventForPreviousTx.args?.dealId;
    // const taskId = await iexec.deal.computeTaskId(dealId, 0);
    // const taskObservable = await iexec.task.obsTask(taskId);
    // taskObservable.subscribe({
    //   next: ({ message, task }) => console.log(message, task.statusName),
    //   error: (e) => console.error(e),
    //   complete: () => console.log('final state reached'),
    // });
    // const response = await iexec.task.fetchResults(taskId);
    // const binary = await response.blob();
    onStatusUpdate({
      title: 'UPLOAD_RESULT_TO_IPFS',
      isDone: true,
    });

    return {
      success: true,
      txHash: tx.hash,
      dealId,
      ipfsLink: '',
      privateKey,
    };
  } catch (e) {
    throw new WorkflowError(
      'Sharing smart contract: Failed to consume a ProtectedData',
      e
    );
  }
};
