import { ethers } from 'ethers';
import {
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  SCONE_TAG,
} from '../../config/config.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
  handleIfProtocolError,
} from '../../utils/errors.js';
import {
  checkUserVoucher,
  filterWorkerpoolOrders,
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
  DefaultWorkerpoolConsumer,
  MatchOptions,
  OnStatusUpdateFn,
  ProcessProtectedDataParams,
  ProcessProtectedDataResponse,
  ProcessProtectedDataStatuses,
} from '../types/index.js';
import { IExecConsumer, VoucherInfo } from '../types/internalTypes.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { getWhitelistContract } from './smartContract/getWhitelistContract.js';
import { isAddressInWhitelist } from './smartContract/whitelistContract.read.js';

export type ProcessProtectedData = typeof processProtectedData;

export const processProtectedData = async ({
  iexec = throwIfMissing(),
  defaultWorkerpool,
  protectedData,
  app,
  userWhitelist,
  dataMaxPrice = MAX_DESIRED_DATA_ORDER_PRICE,
  appMaxPrice = MAX_DESIRED_APP_ORDER_PRICE,
  workerpoolMaxPrice = MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  path,
  args,
  inputFiles,
  secrets,
  workerpool,
  useVoucher = false,
  voucherOwner,
  onStatusUpdate = () => {},
}: IExecConsumer &
  DefaultWorkerpoolConsumer &
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
  const vDataMaxPrice = positiveNumberSchema()
    .label('dataMaxPrice')
    .validateSync(dataMaxPrice);
  const vAppMaxPrice = positiveNumberSchema()
    .label('appMaxPrice')
    .validateSync(appMaxPrice);
  const vWorkerpoolMaxPrice = positiveNumberSchema()
    .label('workerpoolMaxPrice')
    .validateSync(workerpoolMaxPrice);
  const vPath = stringSchema().label('path').validateSync(path);
  const vInputFiles = urlArraySchema()
    .label('inputFiles')
    .validateSync(inputFiles);
  const vArgs = stringSchema().label('args').validateSync(args);
  const vSecrets = secretsSchema().label('secrets').validateSync(secrets);
  const vWorkerpool = addressOrEnsSchema()
    .default(defaultWorkerpool) // Default workerpool if none is specified
    .label('workerpool')
    .validateSync(workerpool);
  const vUseVoucher = booleanSchema()
    .label('useVoucher')
    .validateSync(useVoucher);
  const vVoucherOwner = addressOrEnsSchema()
    .label('voucherOwner')
    .validateSync(voucherOwner);
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
    let userVoucher: VoucherInfo | undefined;
    if (vUseVoucher) {
      try {
        userVoucher = await iexec.voucher.showUserVoucher(
          vVoucherOwner || requester
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
      title: 'FETCH_ORDERS',
      isDone: false,
    });
    const [
      datasetorderForApp,
      datasetorderForWhitelist,
      apporder,
      workerpoolorder,
    ] = await Promise.all([
      // Fetch dataset order
      iexec.orderbook
        .fetchDatasetOrderbook(vProtectedData, {
          app: vApp,
          requester: requester,
        })
        .then((datasetOrderbook) => {
          const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
            (order) => order.order.datasetprice <= vDataMaxPrice
          );
          return desiredPriceDataOrderbook[0]?.order; // may be undefined
        }),
      // Fetch dataset order for whitelist
      iexec.orderbook
        .fetchDatasetOrderbook(vProtectedData, {
          app: vUserWhitelist,
          requester: requester,
        })
        .then((datasetOrderbook) => {
          const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
            (order) => order.order.datasetprice <= vDataMaxPrice
          );
          return desiredPriceDataOrderbook[0]?.order; // may be undefined
        }),
      // Fetch app order
      iexec.orderbook
        .fetchAppOrderbook(vApp, {
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          workerpool: vWorkerpool,
        })
        .then((appOrderbook) => {
          const desiredPriceAppOrderbook = appOrderbook.orders.filter(
            (order) => order.order.appprice <= vAppMaxPrice
          );
          const desiredPriceAppOrder = desiredPriceAppOrderbook[0]?.order;
          if (!desiredPriceAppOrder) {
            throw new Error('No App order found for the desired price');
          }
          return desiredPriceAppOrder;
        }),
      // Fetch workerpool order for App or AppWhitelist
      Promise.all([
        // for app
        iexec.orderbook.fetchWorkerpoolOrderbook({
          workerpool: vWorkerpool,
          app: vApp,
          dataset: vProtectedData,
          requester: requester, // public orders + user specific orders
          isRequesterStrict: useVoucher, // If voucher, we only want user specific orders
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }),
        // for app whitelist
        iexec.orderbook.fetchWorkerpoolOrderbook({
          workerpool: vWorkerpool === ethers.ZeroAddress ? 'any' : vWorkerpool,
          app: vUserWhitelist,
          dataset: vProtectedData,
          requester: requester, // public orders + user specific orders
          isRequesterStrict: useVoucher, // If voucher, we only want user specific orders
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        }),
      ]).then(
        ([workerpoolOrderbookForApp, workerpoolOrderbookForAppWhitelist]) => {
          const desiredPriceWorkerpoolOrder = filterWorkerpoolOrders({
            workerpoolOrders: [
              ...workerpoolOrderbookForApp.orders,
              ...workerpoolOrderbookForAppWhitelist.orders,
            ],
            workerpoolMaxPrice: vWorkerpoolMaxPrice,
            useVoucher: vUseVoucher,
            userVoucher,
          });
          if (!desiredPriceWorkerpoolOrder) {
            throw new Error('No Workerpool order found for the desired price');
          }
          return desiredPriceWorkerpoolOrder;
        }
      ),
    ]);

    if (!workerpoolorder) {
      throw new Error('No Workerpool order found for the desired price');
    }

    const datasetorder = datasetorderForApp || datasetorderForWhitelist;
    if (!datasetorder) {
      throw new Error('No Dataset order found for the desired price');
    }
    vOnStatusUpdate({
      title: 'FETCH_ORDERS',
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
      category: workerpoolorder.category,
      dataset: vProtectedData,
      appmaxprice: apporder.appprice,
      datasetmaxprice: datasetorder.datasetprice,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      tag: SCONE_TAG,
      workerpool: workerpoolorder.workerpool,
      params: {
        iexec_input_files: vInputFiles,
        iexec_secrets: secretsId,
        iexec_args: vArgs,
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    const orders = {
      requestorder,
      workerpoolorder: workerpoolorder,
      apporder: apporder,
      datasetorder: datasetorder,
    };
    const matchOptions: MatchOptions = {
      useVoucher: vUseVoucher,
      ...(vVoucherOwner ? { voucherAddress: userVoucher?.address } : {}),
    };

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
