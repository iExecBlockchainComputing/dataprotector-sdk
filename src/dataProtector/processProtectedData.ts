import {
  COMPUTATION_CATEGORY,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../config/config.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  throwIfMissing,
  urlArraySchema,
} from '../utils/validators.js';
import { IExecConsumer, ProcessProtectedDataParams } from './types.js';
import { WorkflowError } from '../utils/errors.js';
import { fetchOrdersUnderMaxPrice } from '../utils/fetchOrdersUnderMaxPrice.js';
import { pushRequesterSecret } from '../utils/pushRequesterSecret.js';

export const processProtectedData = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  app = throwIfMissing(),
  maxPrice,
  args,
  inputFiles,
  secrets,
}: IExecConsumer & ProcessProtectedDataParams): Promise<string> => {
  try {
    const requester = await iexec.wallet.getAddress();
    const vApp = addressOrEnsOrAnySchema()
      .required()
      .label('authorizedApp')
      .validateSync(app);
    const vProtectedData = addressOrEnsOrAnySchema()
      .required()
      .label('protectedData')
      .validateSync(protectedData);
    const vMaxPrice = positiveNumberSchema()
      .label('maxPrice')
      .validateSync(maxPrice);
    const vInputFiles = urlArraySchema()
      .label('inputFiles')
      .validateSync(inputFiles);

    const requesterAddress = await iexec.wallet.getAddress();
    const isIpfsStorageInitialized =
      await iexec.storage.checkStorageTokenExists(requesterAddress);
    if (!isIpfsStorageInitialized) {
      const token = await iexec.storage.defaultStorageLogin();
      await iexec.storage.pushStorageToken(token);
    }

    const datasetOrderbook = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vApp,
        requester: requesterAddress,
      }
    );
    const appOrderbook = await iexec.orderbook.fetchAppOrderbook(vApp, {
      dataset: protectedData,
      requester,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
      workerpool: WORKERPOOL_ADDRESS,
    });
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: WORKERPOOL_ADDRESS,
      app: vApp,
      dataset: vProtectedData,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
      category: COMPUTATION_CATEGORY,
    });

    const underMaxPriceOrders = fetchOrdersUnderMaxPrice(
      datasetOrderbook,
      appOrderbook,
      workerpoolOrderbook,
      vMaxPrice
    );

    const secrets_id = await pushRequesterSecret(iexec, secrets);

    const requestorderToSign = await iexec.order.createRequestorder({
      app: vApp,
      category: COMPUTATION_CATEGORY,
      dataset: vProtectedData,
      appmaxprice: vMaxPrice,
      workerpoolmaxprice: vMaxPrice,
      tag: SCONE_TAG,
      workerpool: WORKERPOOL_ADDRESS,
      params: {
        iexec_input_files: vInputFiles,
        iexec_developer_logger: true,
        iexec_secrets: secrets_id,
        iexec_args: args,
      },
    });

    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    const { dealid } = await iexec.order.matchOrders({
      requestorder,
      ...underMaxPriceOrders,
    });

    const taskid = await iexec.deal.computeTaskId(dealid, 0);
    return taskid;
  } catch (error) {
    throw new WorkflowError(`${error.message}`, error);
  }
};
