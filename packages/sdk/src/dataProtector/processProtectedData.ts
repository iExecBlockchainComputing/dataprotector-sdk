import {
  DEFAULT_MAX_PRICE,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../config/config.js';
import { WorkflowError } from '../utils/errors.js';
import { fetchOrdersUnderMaxPrice } from '../utils/fetchOrdersUnderMaxPrice.js';
import { pushRequesterSecret } from '../utils/pushRequesterSecret.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  secretsSchema,
  stringSchema,
  throwIfMissing,
  urlArraySchema,
} from '../utils/validators.js';
import { AddressOrENS, IExecConsumer, Taskid } from './types/shared.js';

export type ProcessProtectedDataParams = {
  /**
   * Address or ENS (Ethereum Name Service) of the protected data.
   */
  protectedData: AddressOrENS;

  /**
   * Address or ENS of the authorized application to process the protected data.
   */
  app: AddressOrENS;

  /**
   * The maximum price per task for processing the protected data.
   * It is the sum of the application price, dataset price and workerpool price per task.
   @default = 0
   */
  maxPrice?: number;

  /**
   * Arguments to pass to the application during execution.
   */
  args?: string;

  /**
   * The input file required for the application's execution (direct download URL).
   */
  inputFiles?: string[];

  /**
   * Requester secrets necessary for the application's execution.
   * It is represented as a mapping of numerical identifiers to corresponding secrets.
   */
  secrets?: Record<number, string>;
};

export const processProtectedData = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  app = throwIfMissing(),
  maxPrice = DEFAULT_MAX_PRICE,
  args,
  inputFiles,
  secrets,
}: IExecConsumer & ProcessProtectedDataParams): Promise<Taskid> => {
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

    return await iexec.deal.computeTaskId(dealid, 0);
  } catch (error) {
    throw new WorkflowError(`${error.message}`, error);
  }
};
