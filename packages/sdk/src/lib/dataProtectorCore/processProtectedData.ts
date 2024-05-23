import {
  DEFAULT_MAX_PRICE,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../../config/config.js';
import { WorkflowError } from '../../utils/errors.js';
import { fetchOrdersUnderMaxPrice } from '../../utils/fetchOrdersUnderMaxPrice.js';
import { pushRequesterSecret } from '../../utils/pushRequesterSecret.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  isValidProvider,
  positiveNumberSchema,
  secretsSchema,
  stringSchema,
  throwIfMissing,
  urlArraySchema,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import { getResultFromCompletedTask } from '../dataProtectorSharing/getResultFromCompletedTask.js';
import {
  OnStatusUpdateFn,
  ProcessProtectedDataParams,
  ProcessProtectedDataResponse,
  ProcessProtectedDataStatuses,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export const processProtectedData = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  app = throwIfMissing(),
  maxPrice = DEFAULT_MAX_PRICE,
  args,
  inputFiles,
  secrets,
  workerpool,
  onStatusUpdate = () => {},
}: IExecConsumer &
  ProcessProtectedDataParams): Promise<ProcessProtectedDataResponse> => {
  try {
    await isValidProvider(iexec);
    const vApp = addressOrEnsSchema()
      .required()
      .label('authorizedApp')
      .validateSync(app);
    const vProtectedData = addressOrEnsSchema()
      .required()
      .label('protectedData')
      .validateSync(protectedData);
    const vMaxPrice = positiveNumberSchema()
      .label('maxPrice')
      .validateSync(maxPrice);
    const vInputFiles = urlArraySchema()
      .label('inputFiles')
      .validateSync(inputFiles);
    const vArgs = stringSchema().label('args').validateSync(args);
    const vSecrets = secretsSchema().label('secrets').validateSync(secrets);
    const vWorkerpool = addressOrEnsOrAnySchema()
      .default(WORKERPOOL_ADDRESS)
      .label('workerpool')
      .validateSync(workerpool);
    const vOnStatusUpdate =
      validateOnStatusUpdateCallback<
        OnStatusUpdateFn<ProcessProtectedDataStatuses>
      >(onStatusUpdate);

    const requester = await iexec.wallet.getAddress();
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
    vOnStatusUpdate({
      title: 'FETCH_APP_ORDERBOOK',
      isDone: true,
    });

    vOnStatusUpdate({
      title: 'FETCH_WORKERPOOL_ORDERBOOK',
      isDone: false,
    });
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: vWorkerpool,
      app: vApp,
      dataset: vProtectedData,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
    });
    vOnStatusUpdate({
      title: 'FETCH_WORKERPOOL_ORDERBOOK',
      isDone: true,
    });

    const underMaxPriceOrders = fetchOrdersUnderMaxPrice(
      datasetOrderbook,
      appOrderbook,
      workerpoolOrderbook,
      vMaxPrice
    );

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
      category: underMaxPriceOrders.workerpoolorder.category,
      dataset: vProtectedData,
      appmaxprice: underMaxPriceOrders.apporder.appprice,
      datasetmaxprice: underMaxPriceOrders.datasetorder.datasetprice,
      workerpoolmaxprice: underMaxPriceOrders.workerpoolorder.workerpoolprice,
      tag: SCONE_TAG,
      workerpool: underMaxPriceOrders.workerpoolorder.workerpool,
      params: {
        iexec_input_files: vInputFiles,
        iexec_secrets: secretsId,
        iexec_args: vArgs,
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);
    const { dealid, txHash } = await iexec.order.matchOrders({
      requestorder,
      ...underMaxPriceOrders,
    });
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
      onStatusUpdate: vOnStatusUpdate,
    });

    return {
      txHash: txHash,
      dealId: dealid,
      taskId,
      result,
    };
  } catch (error) {
    throw new WorkflowError(`${error.message}`, error);
  }
};
