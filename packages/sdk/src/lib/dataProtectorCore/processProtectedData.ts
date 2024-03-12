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
  positiveNumberSchema,
  secretsSchema,
  stringSchema,
  throwIfMissing,
  urlArraySchema,
} from '../../utils/validators.js';
import { ProcessProtectedDataParams, Taskid } from '../types/index.js';
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
}: IExecConsumer & ProcessProtectedDataParams): Promise<Taskid> => {
  try {
    const requester = await iexec.wallet.getAddress();
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
        workerpool: vWorkerpool,
        requester,
      }
    );
    const appOrderbook = await iexec.orderbook.fetchAppOrderbook(vApp, {
      dataset: protectedData,
      requester,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
      workerpool: vWorkerpool,
    });
    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: vWorkerpool,
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
      appmaxprice: underMaxPriceOrders.apporder.appprice,
      datasetmaxprice: underMaxPriceOrders.datasetorder.datasetprice,
      workerpoolmaxprice: underMaxPriceOrders.workerpoolorder.workerpoolprice,
      tag: SCONE_TAG,
      workerpool: underMaxPriceOrders.workerpoolorder.workerpool,
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

    return await iexec.deal.computeTaskId(dealid, 0);
  } catch (error) {
    throw new WorkflowError(`${error.message}`, error);
  }
};
