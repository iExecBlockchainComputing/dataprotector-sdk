import { AddressLike, ContractTransactionResponse } from 'ethers';
import { string } from 'yup';
import { IexecLibOrders_v5 } from '../../../generated/typechain/sharing/DataProtectorSharing.js';
import {
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
  DEFAULT_MAX_PRICE,
} from '../../config/config.js';
import {
  WorkflowError,
  consumeProtectedDataErrorMessage,
  handleIfProtocolError,
} from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { getFormattedKeyPair } from '../../utils/rsa.js';
import { getEventFromLogs } from '../../utils/getEventFromLogs.js';
import {
  addressOrEnsSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
  positiveNumberSchema,
  booleanSchema,
} from '../../utils/validators.js';
import {
  ConsumeProtectedDataParams,
  ConsumeProtectedDataResponse,
  ConsumeProtectedDataStatuses,
  OnStatusUpdateFn,
  SharingContractConsumer,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { getAppWhitelistContract } from './smartContract/getAddOnlyAppWhitelistContract.js';
import { getPocoContract } from './smartContract/getPocoContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  getVoucherContract,
  getVoucherHubContract,
} from './smartContract/getVoucherContract.js';
import { getAccountDetails } from './smartContract/pocoContract.reads.js';
import {
  onlyAppInAddOnlyAppWhitelist,
  onlyProtectedDataAuthorizedToBeConsumed,
  onlyFullySponsorableAssets,
  onlyVoucherAuthorizingSharingContract,
  onlyAccountWithMinimumBalance,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';

export const consumeProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData,
  app,
  path,
  workerpool,
  maxPrice = DEFAULT_MAX_PRICE,
  pemPublicKey,
  pemPrivateKey,
  useVoucher = false,
  onStatusUpdate = () => {},
}: IExecConsumer &
  SharingContractConsumer &
  ConsumeProtectedDataParams): Promise<ConsumeProtectedDataResponse> => {
  let vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vMaxPrice = positiveNumberSchema()
    .label('maxPrice')
    .validateSync(maxPrice);
  let vApp = addressOrEnsSchema().required().label('app').validateSync(app);
  let vWorkerpool = addressOrEnsSchema()
    .label('workerpool')
    .validateSync(workerpool);
  const vPemPublicKey = string()
    .label('pemPublicKey')
    .validateSync(pemPublicKey);
  const vPemPrivateKey = string()
    .label('pemPrivateKey')
    .validateSync(pemPrivateKey);
  const vUseVoucher = booleanSchema()
    .label('useVoucher')
    .validateSync(useVoucher);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<ConsumeProtectedDataStatuses>
    >(onStatusUpdate);

  // ENS resolution if needed
  vProtectedData = await resolveENS(iexec, vProtectedData);
  vApp = await resolveENS(iexec, vApp);
  vWorkerpool = await resolveENS(iexec, vWorkerpool);

  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  //---------- Get Contract Instance ----------
  const pocoContract = await getPocoContract(iexec);
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
  let VOUCHER_HUB_CONTRACT;
  let voucherHubContract;
  let voucherContract;
  if (vUseVoucher) {
    // TODO: to remove and set into config.ts file when voucher will be deployed in prod
    VOUCHER_HUB_CONTRACT = await iexec.config.resolveVoucherHubAddress();
    voucherHubContract = await getVoucherHubContract(
      iexec,
      VOUCHER_HUB_CONTRACT
    );
    voucherContract = await getVoucherContract(iexec, userAddress);
  }

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
      spender: vUseVoucher ? voucherContract : sharingContractAddress,
    }),
  ]);

  const addOnlyAppWhitelistContract = await getAppWhitelistContract(
    iexec,
    protectedDataDetails.addOnlyAppWhitelist
  );
  //---------- Pre flight check----------
  onlyProtectedDataAuthorizedToBeConsumed(protectedDataDetails);
  if (vUseVoucher) {
    // TODO: Should we add preflight check to check the voucher is under its expiration date ?
    await onlyVoucherAuthorizingSharingContract({
      sharingContractAddress,
      voucherContract,
    });
  }
  await onlyAppInAddOnlyAppWhitelist({
    addOnlyAppWhitelistContract,
    app: vApp,
  });

  vOnStatusUpdate({
    title: 'FETCH_WORKERPOOL_ORDERBOOK',
    isDone: false,
  });
  try {
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: vWorkerpool || WORKERPOOL_ADDRESS,
      app: vApp,
      dataset: vProtectedData,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
    });
    const workerpoolOrder = workerpoolOrderbook.orders[0]?.order;
    if (!workerpoolOrder) {
      throw new WorkflowError({
        message: consumeProtectedDataErrorMessage,
        errorCause: Error(
          'Could not find a workerpool order, maybe too many requests? You might want to try again later.'
        ),
      });
    }
    if (workerpoolOrder.workerpoolprice > vMaxPrice) {
      throw new WorkflowError({
        message: consumeProtectedDataErrorMessage,
        errorCause: Error(
          `No orders found within the specified price limit of ${vMaxPrice} nRLC.`
        ),
      });
    }
    vOnStatusUpdate({
      title: 'FETCH_WORKERPOOL_ORDERBOOK',
      isDone: true,
    });

    if (useVoucher) {
      //TODO: For now, we authorize only fully sponsorable assets
      await onlyFullySponsorableAssets({
        pocoContract,
        voucherHubContract,
        voucherContract,
        userAddress,
        workerpoolOrder,
      });
    } else {
      onlyAccountWithMinimumBalance({
        accountDetails,
        minimumBalance: workerpoolOrder.workerpoolprice,
      });
    }

    const { publicKey, privateKey } = await getFormattedKeyPair({
      pemPublicKey: vPemPublicKey,
      pemPrivateKey: vPemPrivateKey,
    });

    vOnStatusUpdate({
      title: 'PUSH_ENCRYPTION_KEY',
      isDone: false,
    });
    await iexec.result.pushResultEncryptionKey(publicKey, {
      forceUpdate: true,
    });
    vOnStatusUpdate({
      title: 'PUSH_ENCRYPTION_KEY',
      isDone: true,
    });

    // Make a deal
    vOnStatusUpdate({
      title: 'CONSUME_ORDER_REQUESTED',
      isDone: false,
    });
    const { txOptions } = await iexec.config.resolveContractsClient();
    let tx: ContractTransactionResponse;
    let transactionReceipt;

    const consumeProtectedDataCallParams: [
      AddressLike,
      IexecLibOrders_v5.WorkerpoolOrderStruct,
      AddressLike,
      boolean
    ] = [vProtectedData, workerpoolOrder, vApp, vUseVoucher];

    try {
      if (
        accountDetails.spenderAllowance >=
          BigInt(workerpoolOrder.workerpoolprice) ||
        vUseVoucher
      ) {
        tx = await sharingContract.consumeProtectedData(
          ...consumeProtectedDataCallParams,
          txOptions
        );
      } else {
        //Go here if: we are not in voucher mode and we have insufficient allowance for the spender (sharingContract)
        const callData = sharingContract.interface.encodeFunctionData(
          'consumeProtectedData',
          consumeProtectedDataCallParams
        );
        tx = await pocoContract.approveAndCall(
          sharingContractAddress,
          workerpoolOrder.workerpoolprice,
          callData,
          txOptions
        );
      }
      transactionReceipt = await tx.wait();
    } catch (err) {
      console.error('Smart-contract consumeProtectedData() ERROR', err);
      throw err;
    }

    vOnStatusUpdate({
      title: 'CONSUME_ORDER_REQUESTED',
      isDone: true,
      payload: {
        txHash: tx.hash,
      },
    });

    const specificEventForPreviousTx = getEventFromLogs({
      contract: sharingContract,
      eventName: 'ProtectedDataConsumed',
      logs: transactionReceipt.logs,
    });

    const dealId = specificEventForPreviousTx.args?.dealId;
    const taskId = await iexec.deal.computeTaskId(dealId, 0);
    vOnStatusUpdate({
      title: 'CONSUME_TASK',
      isDone: false,
      payload: { dealId, taskId },
    });

    const taskObservable = await iexec.task.obsTask(taskId, { dealid: dealId });

    await new Promise((resolve, reject) => {
      taskObservable.subscribe({
        next: () => {},
        error: (err) => reject(err),
        complete: () => resolve(undefined),
      });
    });

    vOnStatusUpdate({
      title: 'CONSUME_TASK',
      isDone: true,
      payload: { dealId, taskId },
    });

    const { result } = await getResultFromCompletedTask({
      iexec,
      taskId,
      dealId,
      path,
      pemPrivateKey: privateKey,
      onStatusUpdate: vOnStatusUpdate,
    });

    return {
      txHash: tx.hash,
      dealId,
      taskId,
      result,
      pemPrivateKey: privateKey,
    };
  } catch (e) {
    handleIfProtocolError(e);
    // Try to extract some meaningful error like:
    // "insufficient funds for transfer"
    if (e?.info?.error?.data?.message) {
      throw new WorkflowError({
        message: `${consumeProtectedDataErrorMessage}: ${e.info.error.data.message}`,
        errorCause: e,
      });
    }
    // Try to extract some meaningful error like:
    // "User denied transaction signature"
    if (e?.info?.error?.message) {
      throw new WorkflowError({
        message: `${consumeProtectedDataErrorMessage}: ${e.info.error.message}`,
        errorCause: e,
      });
    }
    throw new WorkflowError({
      message: 'Sharing smart contract: Failed to consume protected data',
      errorCause: e,
    });
  }
};
