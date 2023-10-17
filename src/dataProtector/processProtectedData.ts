import {
  DEFAULT_MAX_PRICE,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../config/config.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  secretsSchema,
  stringSchema,
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
  maxPrice = DEFAULT_MAX_PRICE,
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
    const vArgs = stringSchema().label('args').validateSync(args);
    const vSecrets = secretsSchema().label('secrets').validateSync(secrets);
    const isIpfsStorageInitialized =
      await iexec.storage.checkStorageTokenExists(requester);
    if (!isIpfsStorageInitialized) {
      const token = await iexec.storage.defaultStorageLogin();
      await iexec.storage.pushStorageToken(token);
    }

    const datasetOrderbook = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vApp,
        requester,
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
    });

    const underMaxPriceOrders = fetchOrdersUnderMaxPrice(
      datasetOrderbook,
      appOrderbook,
      workerpoolOrderbook,
      vMaxPrice
    );

    const secretsId = await pushRequesterSecret(iexec, vSecrets);

    const requestorderToSign = await iexec.order.createRequestorder({
      app: vApp,
      category: underMaxPriceOrders.workerpoolorder.category,
      dataset: vProtectedData,
      appmaxprice: vMaxPrice,
      workerpoolmaxprice: vMaxPrice,
      tag: SCONE_TAG,
      workerpool: WORKERPOOL_ADDRESS,
      params: {
        iexec_input_files: vInputFiles,
        iexec_developer_logger: true,
        iexec_secrets: secretsId,
        iexec_args: vArgs,
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
