import { string } from 'yup';
import {
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
  DEFAULT_MAX_PRICE,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
} from '../../config/config.js';
import {
  WorkflowError,
  consumeProtectedDataErrorMessage,
  handleIfProtocolError,
} from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import { getFormattedKeyPair } from '../../utils/rsa.js';
import { getEventFromLogs } from '../../utils/transactionEvent.js';
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
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyAppInAddOnlyAppWhitelist,
  onlyProtectedDataAuthorizedToBeConsumed,
} from './smartContract/preflightChecks.js';
import { getProtectedDataDetails } from './smartContract/sharingContract.reads.js';
import {
  getVoucherContract,
  getVoucherHubContract,
} from './smartContract/voucher-utils.js';
import { getBigInt } from 'ethers';

export const consumeProtectedData = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedData,
  maxPrice = DEFAULT_MAX_PRICE,
  app,
  workerpool,
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

  const addOnlyAppWhitelistContract = await getAppWhitelistContract(
    iexec,
    protectedDataDetails.addOnlyAppWhitelist
  );
  //---------- Pre flight check----------
  onlyProtectedDataAuthorizedToBeConsumed(protectedDataDetails);
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
    let tx;
    let transactionReceipt;

    if (useVoucher) {
      const voucherInfo = await iexec.voucher.showUserVoucher(userAddress);
      const contracts = await iexec.config.resolveContractsClient();
      const voucherContract = await getVoucherContract(
        contracts,
        voucherInfo.address
      );
      // TODO: replace by await iexec.voucher.isAccountAuthorized(DEFAULT_SHARING_CONTRACT_ADDRESS) once is implemented in iexec-sdk
      const isAuthorizedToUseVoucher =
        await voucherContract.isAccountAuthorized(
          DEFAULT_SHARING_CONTRACT_ADDRESS
        );
      if (!isAuthorizedToUseVoucher) {
        throw new Error(
          `The sharing contract (${DEFAULT_SHARING_CONTRACT_ADDRESS}) is not authorized to use the voucher ${voucherInfo.address}. Please authorize it to use the voucher.`
        );
      }
      const voucherHubAddress = await iexec.config.resolveVoucherHubAddress();
      const voucherHubContract = getVoucherHubContract(
        contracts,
        voucherHubAddress
      );
      const voucherType = getBigInt(voucherInfo.type.toString());
      const isWorkerpoolSponsoredByVoucher =
        await voucherHubContract.isAssetEligibleToMatchOrdersSponsoring(
          voucherType,
          vWorkerpool
        );
      if (isWorkerpoolSponsoredByVoucher) {
        const workerpoolPrice = Number(workerpoolOrder.workerpoolprice);
        const voucherBalance = Number(voucherInfo.balance);

        if (voucherBalance < workerpoolPrice) {
          const missingAmount = workerpoolPrice - voucherBalance;
          const userAllowance = await iexec.account.checkAllowance(
            userAddress,
            voucherInfo.address
          );

          if (userAllowance === 0 || Number(userAllowance) < workerpoolPrice) {
            throw new Error(
              `Voucher balance is insufficient to sponsor workerpool. Please approve an additional ${missingAmount} for voucher usage.`
            );
          }
        }
      } else {
        throw new Error(
          `${workerpool} is not sponsored by the voucher ${voucherInfo.address}`
        );
      }
    }

    // TODO: when non free workerpoolorders is supported add approveAndCall (see implementation of buyProtectedData/rentProtectedData/subscribeToCollection)
    try {
      tx = await sharingContract.consumeProtectedData(
        vProtectedData,
        workerpoolOrder,
        vApp,
        vUseVoucher,
        txOptions
      );
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

    const specificEventForPreviousTx = getEventFromLogs(
      'ProtectedDataConsumed',
      transactionReceipt.logs,
      { strict: true }
    );

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
