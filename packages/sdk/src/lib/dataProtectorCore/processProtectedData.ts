import { ethers } from 'ethers';
import {
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_DATA_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  TEE_TAG,
} from '../../config/config.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
  handleIfProtocolError,
  ValidationError,
} from '../../utils/errors.js';
import { filterWorkerpoolOrders } from '../../utils/processProtectedData.models.js';
import { pushRequesterSecret } from '../../utils/pushRequesterSecret.js';
import {
  getPemFormattedKeyPair,
  formatPemPublicKeyForSMS,
} from '../../utils/rsa.js';
import {
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
  OnStatusUpdateFn,
  ProcessProtectedDataParams,
  ProcessProtectedDataResponse,
  ProcessProtectedDataStatuses,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getResultFromCompletedTask } from './getResultFromCompletedTask.js';
import { getWhitelistContract } from './smartContract/getWhitelistContract.js';
import { isAddressInWhitelist } from './smartContract/whitelistContract.read.js';
import { waitForTaskCompletion } from './waitForTaskCompletion.js';

export type ProcessProtectedData = typeof processProtectedData;

export const processProtectedData = async <
  Params extends ProcessProtectedDataParams
>({
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
  encryptResult = false,
  pemPrivateKey,
  waitForResult = true,
  onStatusUpdate = () => {},
}: IExecConsumer & DefaultWorkerpoolConsumer & Params): Promise<
  ProcessProtectedDataResponse<Params>
> => {
  const vProtectedData = addressSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vApp = addressSchema()
    .required()
    .label('authorizedApp')
    .validateSync(app);
  const vUserWhitelist = addressSchema()
    .label('userWhitelist')
    .validateSync(userWhitelist);
  const vDataMaxPrice = positiveNumberSchema()
    .label('dataMaxPrice')
    .default(0)
    .validateSync(dataMaxPrice);
  const vAppMaxPrice = positiveNumberSchema()
    .label('appMaxPrice')
    .default(0)
    .validateSync(appMaxPrice);
  const vWorkerpoolMaxPrice = positiveNumberSchema()
    .label('workerpoolMaxPrice')
    .default(0)
    .validateSync(workerpoolMaxPrice);
  const vPath = stringSchema().label('path').validateSync(path);
  const vInputFiles = urlArraySchema()
    .label('inputFiles')
    .validateSync(inputFiles);
  const vArgs = stringSchema().label('args').validateSync(args);
  const vSecrets = secretsSchema().label('secrets').validateSync(secrets);
  const vWorkerpool = addressSchema()
    .default(defaultWorkerpool) // Default workerpool if none is specified
    .label('workerpool')
    .validateSync(workerpool);
  const vEncryptResult = booleanSchema()
    .label('encryptResult')
    .validateSync(encryptResult);
  const vPemPrivateKey = stringSchema()
    .label('pemPrivateKey')
    .validateSync(pemPrivateKey);
  const vWaitForResult = booleanSchema()
    .label('waitForResult')
    .validateSync(waitForResult);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<ProcessProtectedDataStatuses>
    >(onStatusUpdate);

  // Validate that if pemPrivateKey is provided, encryptResult must be true
  if (vPemPrivateKey && !vEncryptResult) {
    throw new ValidationError(
      'pemPrivateKey can only be provided when encryptResult is true'
    );
  }

  try {
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
    vOnStatusUpdate({
      title: 'FETCH_ORDERS',
      isDone: false,
    });
    // Fetch app order first to determine TEE framework
    const apporder = await iexec.orderbook
      .fetchAppOrderbook({
        app: vApp,
        minTag: TEE_TAG,
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
      });
    const workerpoolMinTag = apporder.tag;

    const [datasetorderForApp, datasetorderForWhitelist, workerpoolorder] =
      await Promise.all([
        // Fetch dataset order
        iexec.orderbook
          .fetchDatasetOrderbook({
            dataset: vProtectedData,
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
          .fetchDatasetOrderbook({
            dataset: vProtectedData,
            app: vUserWhitelist,
            requester: requester,
          })
          .then((datasetOrderbook) => {
            const desiredPriceDataOrderbook = datasetOrderbook.orders.filter(
              (order) => order.order.datasetprice <= vDataMaxPrice
            );
            return desiredPriceDataOrderbook[0]?.order; // may be undefined
          }),

        // Fetch workerpool order for App or AppWhitelist
        Promise.all([
          // for app
          iexec.orderbook.fetchWorkerpoolOrderbook({
            workerpool: vWorkerpool,
            app: vApp,
            dataset: vProtectedData,
            requester: requester, // public orders + user specific orders
            isRequesterStrict: false,
            minTag: workerpoolMinTag,
            category: 0,
          }),
          // for app whitelist
          iexec.orderbook.fetchWorkerpoolOrderbook({
            workerpool:
              vWorkerpool === ethers.ZeroAddress ? 'any' : vWorkerpool,
            app: vUserWhitelist,
            dataset: vProtectedData,
            requester: requester, // public orders + user specific orders
            isRequesterStrict: false,
            minTag: workerpoolMinTag,
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
            });
            if (!desiredPriceWorkerpoolOrder) {
              throw new Error(
                'No Workerpool order found for the desired price'
              );
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
      tag: TEE_TAG,
      workerpool: workerpoolorder.workerpool,
      params: {
        iexec_input_files: vInputFiles,
        iexec_secrets: secretsId,
        iexec_args: vArgs,
        ...(vEncryptResult ? { iexec_result_encryption: true } : {}),
      },
    });
    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    const orders = {
      requestorder,
      workerpoolorder: workerpoolorder,
      apporder: apporder,
      datasetorder: datasetorder,
    };
    const { dealid: dealId, txHash } = await iexec.order.matchOrders(orders);
    const taskId = await iexec.deal.computeTaskId(dealId, 0);

    vOnStatusUpdate({
      title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
      isDone: true,
      payload: {
        txHash,
        dealId,
        taskId,
      },
    });

    if (vWaitForResult === false) {
      return {
        txHash,
        dealId,
        taskId,
        ...(privateKey ? { pemPrivateKey: privateKey } : {}),
      } as ProcessProtectedDataResponse<Params>;
    }

    vOnStatusUpdate({
      title: 'TASK_EXECUTION',
      isDone: false,
      payload: {
        taskId: taskId,
      },
    });

    await waitForTaskCompletion({
      iexec,
      dealId,
      taskId,
    });

    vOnStatusUpdate({
      title: 'TASK_EXECUTION',
      isDone: true,
      payload: {
        taskId,
      },
    });

    const { result } = await getResultFromCompletedTask({
      iexec,
      taskId,
      path: vPath,
      pemPrivateKey: privateKey,
      onStatusUpdate: vOnStatusUpdate,
    });

    return {
      txHash,
      dealId,
      taskId,
      result,
      ...(privateKey ? { pemPrivateKey: privateKey } : {}),
    } as ProcessProtectedDataResponse<Params>;
  } catch (error) {
    console.error('[processProtectedData] ERROR', error);
    handleIfProtocolError(error);
    throw new WorkflowError({
      message: processProtectedDataErrorMessage,
      errorCause: error,
    });
  }
};
