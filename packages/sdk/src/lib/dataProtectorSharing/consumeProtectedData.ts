import { ethers } from 'ethers';
import {
  DEFAULT_PROTECTED_DATA_SHARING_APP,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../../config/config.js';
import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { generateKeyPair } from '../../utils/rsa.js';
import { getEventFromLogs } from '../../utils/transactionEvent.js';
import { addressOrEnsSchema, throwIfMissing } from '../../utils/validators.js';
import {
  ConsumeProtectedDataParams,
  ConsumeProtectedDataResponse,
  SharingContractConsumer,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getPocoAppRegistryContract } from './smartContract/getPocoRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyProtectedDataAuthorizedToBeConsumed } from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const consumeProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
  appAddress,
  onStatusUpdate = () => {},
}: IExecConsumer &
  SharingContractConsumer &
  ConsumeProtectedDataParams): Promise<ConsumeProtectedDataResponse> => {
  let vProtectedDataAddress = addressOrEnsSchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);
  let vAppAddress = addressOrEnsSchema()
    .label('appAddress')
    .validateSync(appAddress);

  // ENS resolution if needed
  vProtectedDataAddress = await resolveENS(iexec, vProtectedDataAddress);
  vAppAddress = await resolveENS(iexec, vAppAddress);

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
  onlyProtectedDataAuthorizedToBeConsumed(protectedDataDetails);

  try {
    // get the app set to consume the protectedData
    const appWhitelistAddress = protectedDataDetails.appWhitelist;
    // TODO: Check a app is field by the end user that it correspond to appWhitelist => Preflight check

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
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await sharingContract.consumeProtectedData(
      vProtectedDataAddress,
      workerpoolOrder,
      contentPath,
      vAppAddress || DEFAULT_PROTECTED_DATA_SHARING_APP,
      txOptions
    );
    const transactionReceipt = await tx.wait();
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
    onStatusUpdate({
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
