import {
  DEFAULT_PROTECTED_DATA_SHARING_APP,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../../config/config.js';
import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { generateKeyPair } from '../../utils/rsa.js';
import { getEventFromLogs } from '../../utils/transactionEvent.js';
import {
  addressOrEnsSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import { OnStatusUpdateFn } from '../types/commonTypes.js';
import { IExecConsumer } from '../types/internalTypes.js';
import {
  SharingContractConsumer,
  ConsumeProtectedDataParams,
  ConsumeProtectedDataResponse,
  ConsumeProtectedDataStatuses,
} from '../types/sharingTypes.js';
import { getAppWhitelistContract } from './smartContract/getAppWhitelistContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyAppInAppWhitelist,
  onlyProtectedDataAuthorizedToBeConsumed,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const consumeProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData,
  app,
  onStatusUpdate = () => {},
}: IExecConsumer &
  SharingContractConsumer &
  ConsumeProtectedDataParams): Promise<ConsumeProtectedDataResponse> => {
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  let vApp = addressOrEnsSchema().label('app').validateSync(app);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<ConsumeProtectedDataStatuses>
    >(onStatusUpdate);

  // ENS resolution if needed
  vProtectedData = await resolveENS(iexec, vProtectedData);
  vApp = await resolveENS(iexec, vApp);

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

  const appWhitelistContract = await getAppWhitelistContract(
    iexec,
    protectedDataDetails.appWhitelist
  );
  //---------- Pre flight check----------
  onlyProtectedDataAuthorizedToBeConsumed(protectedDataDetails);
  onlyAppInAppWhitelist({ appWhitelistContract, app: vApp });

  try {
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: WORKERPOOL_ADDRESS,
      app,
      dataset: vProtectedData,
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
    vOnStatusUpdate({
      title: 'CONSUME_PROTECTED_DATA',
      isDone: false,
    });
    const contentPath = '';
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.consumeProtectedData(
      vProtectedData,
      workerpoolOrder,
      contentPath,
      vApp || DEFAULT_PROTECTED_DATA_SHARING_APP,
      txOptions
    );
    const transactionReceipt = await tx.wait();
    vOnStatusUpdate({
      title: 'CONSUME_PROTECTED_DATA',
      isDone: true,
      payload: {
        txHash: tx.hash,
      },
    });

    // TODO: Uncomment when IPFS storage token is released
    // Get the result IPFS link
    vOnStatusUpdate({
      title: 'UPLOAD_RESULT_TO_IPFS',
      isDone: false,
    });
    // TODO: no type
    const specificEventForPreviousTx = getEventFromLogs(
      'ProtectedDataConsumed',
      transactionReceipt.logs,
      { strict: true }
    );

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
    vOnStatusUpdate({
      title: 'UPLOAD_RESULT_TO_IPFS',
      isDone: true,
    });

    return {
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
