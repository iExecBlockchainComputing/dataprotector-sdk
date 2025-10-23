import { utils } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';
import {
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  SCONE_TAG,
} from '../../config/config.js';
import {
  WorkflowError,
  handleIfProtocolError,
  prepareBulkRequestErrorMessage,
} from '../../utils/errors.js';
import { pushRequesterSecret } from '../../utils/pushRequesterSecret.js';
import {
  getPemFormattedKeyPair,
  formatPemPublicKeyForSMS,
} from '../../utils/rsa.js';
import {
  addressOrEnsSchema,
  booleanSchema,
  positiveNumberSchema,
  secretsSchema,
  stringSchema,
  throwIfMissing,
  urlArraySchema,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  DefaultWorkerpoolConsumer,
  OnStatusUpdateFn,
  PrepareBulkRequestParams,
  PrepareBulkRequestResponse,
  PrepareBulkRequestStatuses,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export type PrepareBulkRequest = typeof prepareBulkRequest;

export const prepareBulkRequest = async ({
  iexec = throwIfMissing(),
  bulkOrders,
  app,
  maxProtectedDataPerTask,
  appMaxPrice = MAX_DESIRED_APP_ORDER_PRICE,
  workerpoolMaxPrice = MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  args,
  inputFiles,
  secrets,
  workerpool,
  encryptResult = false,
  pemPrivateKey,
  onStatusUpdate = () => {},
}: IExecConsumer &
  DefaultWorkerpoolConsumer &
  PrepareBulkRequestParams): Promise<PrepareBulkRequestResponse> => {
  const vBulkOrders = bulkOrders;
  if (!vBulkOrders || vBulkOrders.length === 0) {
    throw new Error('bulkOrders is required and must not be empty');
  }
  const vApp = addressOrEnsSchema().required().label('app').validateSync(app);
  const vMaxProtectedDataPerTask = positiveNumberSchema()
    .required()
    .label('maxProtectedDataPerTask')
    .validateSync(maxProtectedDataPerTask);
  const vAppMaxPrice = positiveNumberSchema()
    .label('appMaxPrice')
    .validateSync(appMaxPrice);
  const vWorkerpoolMaxPrice = positiveNumberSchema()
    .label('workerpoolMaxPrice')
    .validateSync(workerpoolMaxPrice);
  const vInputFiles = urlArraySchema()
    .label('inputFiles')
    .validateSync(inputFiles);
  const vArgs = stringSchema().label('args').validateSync(args);
  const vSecrets = secretsSchema().label('secrets').validateSync(secrets);
  const vWorkerpool = addressOrEnsSchema()
    .default(NULL_ADDRESS)
    .label('workerpool')
    .validateSync(workerpool);
  const vEncryptResult = booleanSchema()
    .label('encryptResult')
    .validateSync(encryptResult);
  const vPemPrivateKey = stringSchema()
    .label('pemPrivateKey')
    .validateSync(pemPrivateKey);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<PrepareBulkRequestStatuses>
    >(onStatusUpdate);

  // Validate that if pemPrivateKey is provided, encryptResult must be true
  if (vPemPrivateKey && !vEncryptResult) {
    throw new Error(
      'pemPrivateKey can only be provided when encryptResult is true'
    );
  }

  // TODO validate bulkOrders?
  // price, volume, app, workerpool, requester, signature (including whitelists)

  try {
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
      title: 'GENERATE_ENCRYPTION_KEY',
      isDone: false,
    });

    // Handle result encryption
    let privateKey: string | undefined;
    if (vEncryptResult) {
      if (!vPemPrivateKey) {
        vOnStatusUpdate({
          title: 'GENERATE_ENCRYPTION_KEY',
          isDone: false,
        });
      }
      const pemKeyPair = await getPemFormattedKeyPair({
        pemPrivateKey: vPemPrivateKey,
      });
      privateKey = pemKeyPair.pemPrivateKey;
      // Notify user if a new key was generated
      if (!vPemPrivateKey) {
        vOnStatusUpdate({
          title: 'GENERATE_ENCRYPTION_KEY',
          isDone: true,
          payload: {
            pemPrivateKey: pemKeyPair.pemPrivateKey,
          },
        });
      }

      vOnStatusUpdate({
        title: 'PUSH_ENCRYPTION_KEY',
        isDone: false,
        payload: {
          pemPublicKey: pemKeyPair.pemPublicKey,
        },
      });

      await iexec.result.pushResultEncryptionKey(
        formatPemPublicKeyForSMS(pemKeyPair.pemPublicKey),
        {
          forceUpdate: true,
        }
      );

      vOnStatusUpdate({
        title: 'PUSH_ENCRYPTION_KEY',
        isDone: true,
        payload: {
          pemPublicKey: pemKeyPair.pemPublicKey,
        },
      });
    }

    // Prepare dataset bulk
    vOnStatusUpdate({
      title: 'PREPARE_PROTECTED_DATA_BULK',
      isDone: false,
    });

    const { cid, volume } = await iexec.order.prepareDatasetBulk(vBulkOrders, {
      maxDatasetPerTask: parseInt(vMaxProtectedDataPerTask.toString()),
    });

    vOnStatusUpdate({
      title: 'PREPARE_PROTECTED_DATA_BULK',
      isDone: true,
    });

    // Create request order for the whole bulk (only once)
    vOnStatusUpdate({
      title: 'CREATE_REQUEST_ORDER',
      isDone: false,
    });

    const requestorderToSign = await iexec.order.createRequestorder({
      app: vApp,
      appmaxprice: vAppMaxPrice,
      workerpool: vWorkerpool,
      workerpoolmaxprice: vWorkerpoolMaxPrice,
      volume,
      category: 0,
      tag: SCONE_TAG,
      params: {
        bulk_cid: cid,
        iexec_input_files: vInputFiles,
        iexec_secrets: secretsId,
        iexec_args: vArgs,
        ...(vEncryptResult ? { iexec_result_encryption: true } : {}),
      },
      trust: 0,
      // bulk order
      datasetmaxprice: 0,
      dataset: utils.NULL_ADDRESS,
    });

    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    vOnStatusUpdate({
      title: 'CREATE_REQUEST_ORDER',
      isDone: true,
    });

    return {
      bulkRequest: requestorder,
      ...(privateKey ? { pemPrivateKey: privateKey } : {}),
    };
  } catch (error) {
    console.error('[prepareBulkRequest] ERROR', error);
    handleIfProtocolError(error);
    throw new WorkflowError({
      message: prepareBulkRequestErrorMessage,
      errorCause: error,
    });
  }
};
