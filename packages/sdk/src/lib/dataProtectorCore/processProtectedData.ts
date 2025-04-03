import { ethers } from 'ethers';
import {
  DEFAULT_MAX_PRICE,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../../config/config.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
  handleIfProtocolError,
} from '../../utils/errors.js';
import {
  checkUserVoucher,
  findWorkerpoolOrders,
} from '../../utils/processProtectedData.models.js';
import { pushRequesterSecret } from '../../utils/pushRequesterSecret.js';
import {
  addressOrEnsSchema,
  addressSchema,
  booleanSchema,
  positiveNumberSchema,
  secretsSchema,
  stringSchema,
  throwIfMissing,
  urlArraySchema,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import { isERC734 } from '../../utils/whitelist.js';
import {
  MatchOptions,
  OnStatusUpdateFn,
  ProcessProtectedDataParams,
  ProcessProtectedDataResponse,
  ProcessProtectedDataStatuses,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { getWhitelistContract } from './smartContract/getWhitelistContract.js';
import { isAddressInWhitelist } from './smartContract/whitelistContract.read.js';

export type ProcessProtectedData = typeof processProtectedData;

export const processProtectedData = async ({
  iexec = throwIfMissing(),
  protectedData,
  app,
  userWhitelist,
  maxPrice = DEFAULT_MAX_PRICE,
  path,
  args,
  inputFiles,
  secrets,
  workerpool,
  useVoucher = false,
  voucherAddress,
  onStatusUpdate = () => {},
}: IExecConsumer &
  ProcessProtectedDataParams): Promise<ProcessProtectedDataResponse> => {
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vApp = addressOrEnsSchema()
    .required()
    .label('authorizedApp')
    .validateSync(app);
  const vUserWhitelist = addressSchema()
    .label('userWhitelist')
    .validateSync(userWhitelist);
  const vMaxPrice = positiveNumberSchema()
    .label('maxPrice')
    .validateSync(maxPrice);
  const vPath = stringSchema().label('path').validateSync(path);
  const vInputFiles = urlArraySchema()
    .label('inputFiles')
    .validateSync(inputFiles);
  const vArgs = stringSchema().label('args').validateSync(args);
  const vSecrets = secretsSchema().label('secrets').validateSync(secrets);
  const vWorkerpool = addressOrEnsSchema()
    .default(WORKERPOOL_ADDRESS) // Default workerpool if none is specified
    .label('workerpool')
    .validateSync(workerpool);
  const vUseVoucher = booleanSchema()
    .label('useVoucher')
    .validateSync(useVoucher);
  const vVoucherAddress = addressOrEnsSchema()
    .label('voucherAddress')
    .validateSync(voucherAddress);
  try {
    const vOnStatusUpdate =
      validateOnStatusUpdateCallback<
        OnStatusUpdateFn<ProcessProtectedDataStatuses>
      >(onStatusUpdate);

    let requester = await iexec.wallet.getAddress();
    if (vUserWhitelist) {
      const isValidWhitelist = await isERC734(iexec, vUserWhitelist);

      if (!isValidWhitelist) {
        throw new Error(
          `userWhitelist is not a valid whitelist contract, the contract must implement the ERC734 interface`
        );
      } else {
        const whitelistContract = await getWhitelistContract(
          iexec,
          vUserWhitelist
        );
        const isRequesterInWhitelist = await isAddressInWhitelist({
          whitelistContract,
          address: vUserWhitelist,
        });

        if (!isRequesterInWhitelist) {
          throw new Error(
            "As a user, you are not in the whitelist. You can't access the protectedData so you can't process it."
          );
        }
        requester = vUserWhitelist;
      }
    }
    let userVoucher;
    if (vUseVoucher) {
      try {
        userVoucher = await iexec.voucher.showUserVoucher(
          vVoucherAddress || requester
        );
        checkUserVoucher({ userVoucher });
      } catch (err) {
        if (err?.message?.startsWith('No Voucher found for address')) {
          throw new Error(
            'Oops, it seems your wallet is not associated with any voucher. Check on https://builder.iex.ec/'
          );
        }
        throw err;
      }
    }

    vOnStatusUpdate({
      title: 'FETCH_PROTECTED_DATA_ORDERBOOK',
      isDone: false,
    });
    const datasetOrderbook = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vApp,
        workerpool: vWorkerpool,
        requester,
      }
    );
    const datasetorder = datasetOrderbook.orders[0]?.order; //The first order is the cheapest one
    if (!datasetorder) {
      throw new Error(`No dataset orders found`);
    }
    vOnStatusUpdate({
      title: 'FETCH_PROTECTED_DATA_ORDERBOOK',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'FETCH_APP_ORDERBOOK',
      isDone: false,
    });
    const appOrderbook = await iexec.orderbook.fetchAppOrderbook(vApp, {
      dataset: protectedData,
      requester,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
      workerpool: vWorkerpool,
    });
    const apporder = appOrderbook.orders[0]?.order; //The first order is the cheapest one
    if (!apporder) {
      throw new Error(`No app orders found`);
    }
    vOnStatusUpdate({
      title: 'FETCH_APP_ORDERBOOK',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'FETCH_WORKERPOOL_ORDERBOOK',
      isDone: false,
    });
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: vWorkerpool === ethers.ZeroAddress ? 'any' : vWorkerpool, // if address zero was chosen use any workerpool
      app: vApp,
      dataset: vProtectedData,
      requester: vVoucherAddress || requester, // prioritize user-specific orders if a voucher is used
      isRequesterStrict: useVoucher, // If voucher, we only want user specific orders
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
      category: 0,
    });
    const workerpoolOrder = findWorkerpoolOrders({
      workerpoolOrders: [...workerpoolOrderbook.orders],
      useVoucher: vUseVoucher,
      userVoucher,
    });
    if (!workerpoolOrder) {
      throw new Error('No Workerpool order found.');
    }
    vOnStatusUpdate({
      title: 'FETCH_WORKERPOOL_ORDERBOOK',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'PUSH_REQUESTER_SECRET',
      isDone: false,
    });
    const secretsId = await pushRequesterSecret(iexec, vSecrets);
    vOnStatusUpdate({
      title: 'PUSH_REQUESTER_SECRET',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
      isDone: false,
    });
    const requestorderToSign = await iexec.order.createRequestorder({
      app: vApp,
      category: workerpoolOrder.category,
      dataset: vProtectedData,
      appmaxprice: apporder.appprice,
      datasetmaxprice: datasetorder.datasetprice,
      workerpoolmaxprice: workerpoolOrder.workerpoolprice,
      tag: SCONE_TAG,
      workerpool: workerpoolOrder.workerpool,
      params: {
        iexec_input_files: vInputFiles,
        iexec_secrets: secretsId,
        iexec_args: vArgs,
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    const orders = {
      requestorder,
      workerpoolorder: workerpoolOrder,
      apporder: apporder,
      datasetorder: datasetorder,
    };
    const matchOptions: MatchOptions = {
      useVoucher: vUseVoucher,
      ...(vVoucherAddress ? { voucherAddress: vVoucherAddress } : {}),
    };

    const estimatedMatchOrderPrice = await iexec.order.estimateMatchOrders(
      orders,
      matchOptions
    );
    if (
      estimatedMatchOrderPrice.total
        .sub(estimatedMatchOrderPrice.sponsored)
        .ltn(vMaxPrice)
    ) {
      throw new Error(
        `No orders found within the specified price limit ${vMaxPrice} nRLC.`
      );
    }

    const { dealid, txHash } = await iexec.order.matchOrders(
      orders,
      matchOptions
    );
    const taskId = await iexec.deal.computeTaskId(dealid, 0);

    vOnStatusUpdate({
      title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
      isDone: true,
      payload: {
        txHash: txHash,
        dealId: dealid,
        taskId: taskId,
      },
    });

    vOnStatusUpdate({
      title: 'CONSUME_TASK',
      isDone: false,
      payload: {
        taskId: taskId,
      },
    });
    const taskObservable = await iexec.task.obsTask(taskId, { dealid: dealid });
    await new Promise((resolve, reject) => {
      taskObservable.subscribe({
        next: () => {},
        error: (e) => {
          reject(e);
        },
        complete: () => resolve(undefined),
      });
    });

    vOnStatusUpdate({
      title: 'CONSUME_TASK',
      isDone: true,
      payload: {
        taskId: taskId,
      },
    });

    const { result } = await getResultFromCompletedTask({
      iexec,
      taskId,
      path: vPath,
      onStatusUpdate: vOnStatusUpdate,
    });

    return {
      txHash: txHash,
      dealId: dealid,
      taskId,
      result,
    };
  } catch (error) {
    console.error('[processProtectedData] ERROR', error);
    handleIfProtocolError(error);
    throw new WorkflowError({
      message: processProtectedDataErrorMessage,
      errorCause: error,
    });
  }
};
