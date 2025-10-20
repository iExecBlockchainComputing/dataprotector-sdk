import { utils } from 'iexec';
import { NULL_ADDRESS } from 'iexec/utils';
import {
  MAX_DESIRED_APP_ORDER_PRICE,
  MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
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
import { getFormattedKeyPair } from '../../utils/rsa.js';
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
import { isERC734 } from '../../utils/whitelist.js';
import {
  DefaultWorkerpoolConsumer,
  MatchOptions,
  OnStatusUpdateFn,
  ProcessBulkRequestParams,
  ProcessBulkRequestResponse,
  ProcessBulkRequestStatuses,
} from '../types/index.js';
import { IExecConsumer, VoucherInfo } from '../types/internalTypes.js';
import { getWhitelistContract } from './smartContract/getWhitelistContract.js';
import { isAddressInWhitelist } from './smartContract/whitelistContract.read.js';

export type ProcessBulkRequest = typeof processBulkRequest;

// Helper function to avoid unsafe setTimeout reference in loop
const waitForRetry = (ms: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
};

export const processBulkRequest = async ({
  iexec = throwIfMissing(),
  defaultWorkerpool,
  bulkOrders,
  app,
  maxProtectedDataPerTask,
  appMaxPrice = MAX_DESIRED_APP_ORDER_PRICE,
  workerpoolMaxPrice = MAX_DESIRED_WORKERPOOL_ORDER_PRICE,
  args,
  inputFiles,
  secrets,
  workerpool,
  useVoucher = false,
  voucherOwner,
  encryptResult = false,
  pemPrivateKey,
  onStatusUpdate = () => {},
}: IExecConsumer &
  DefaultWorkerpoolConsumer &
  ProcessBulkRequestParams): Promise<ProcessBulkRequestResponse> => {
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
    .default(defaultWorkerpool) // Default workerpool if none is specified
    .label('workerpool')
    .validateSync(workerpool);
  const vUseVoucher = booleanSchema()
    .label('useVoucher')
    .validateSync(useVoucher);
  const vVoucherOwner = addressOrEnsSchema()
    .label('voucherOwner')
    .validateSync(voucherOwner);
  const vEncryptResult = booleanSchema()
    .label('encryptResult')
    .validateSync(encryptResult);
  const vPemPrivateKey = stringSchema()
    .label('pemPrivateKey')
    .validateSync(pemPrivateKey);

  // Validate that if pemPrivateKey is provided, encryptResult must be true
  if (vPemPrivateKey && !vEncryptResult) {
    throw new Error(
      'pemPrivateKey can only be provided when encryptResult is true'
    );
  }

  try {
    const vOnStatusUpdate =
      validateOnStatusUpdateCallback<
        OnStatusUpdateFn<ProcessBulkRequestStatuses>
      >(onStatusUpdate);

    let requester = await iexec.wallet.getAddress();
    let userWhitelist: string | undefined;

    // Check if any bulk order has a user whitelist
    const bulkOrderWithWhitelist = vBulkOrders.find(
      (order) =>
        order.requesterrestrict !== '0x0000000000000000000000000000000000000000'
    );

    if (bulkOrderWithWhitelist) {
      userWhitelist = bulkOrderWithWhitelist.requesterrestrict;
      const isValidWhitelist = await isERC734(iexec, userWhitelist);

      if (!isValidWhitelist) {
        throw new Error(
          `userWhitelist is not a valid whitelist contract, the contract must implement the ERC734 interface`
        );
      } else {
        const whitelistContract = await getWhitelistContract(
          iexec,
          userWhitelist
        );
        const isRequesterInWhitelist = await isAddressInWhitelist({
          whitelistContract,
          address: userWhitelist,
        });

        if (!isRequesterInWhitelist) {
          throw new Error(
            "As a user, you are not in the whitelist. You can't access the protectedData so you can't process it."
          );
        }
        requester = userWhitelist;
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

    // Fetch app order
    const apporder = await iexec.orderbook
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
      });

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
      title: 'GENERATE_ENCRYPTION_KEY',
      isDone: false,
    });

    // Handle result encryption
    let privateKey: string | undefined;
    if (vEncryptResult) {
      const { publicKey, privateKey: generatedPrivateKey } =
        await getFormattedKeyPair({
          pemPrivateKey: vPemPrivateKey,
        });
      privateKey = generatedPrivateKey;

      // Notify user if a new key was generated
      if (!vPemPrivateKey) {
        vOnStatusUpdate({
          title: 'GENERATE_ENCRYPTION_KEY',
          isDone: true,
          payload: {
            message: 'New encryption key pair generated',
            pemPrivateKey: generatedPrivateKey,
          },
        });
      } else {
        vOnStatusUpdate({
          title: 'PUSH_ENCRYPTION_KEY',
          isDone: false,
        });
      }

      await iexec.result.pushResultEncryptionKey(publicKey, {
        forceUpdate: true,
      });

      vOnStatusUpdate({
        title: 'PUSH_ENCRYPTION_KEY',
        isDone: true,
        payload: {
          publicKey,
        },
      });
    }

    vOnStatusUpdate({
      title: 'PREPARE_PROTECTED_DATA_BULK',
      isDone: false,
    });

    // Prepare dataset bulk
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
      workerpool: vWorkerpool,
      dataset: utils.NULL_ADDRESS,
      volume,
      category: 0,
      params: {
        bulk_cid: cid,
        iexec_input_files: vInputFiles,
        iexec_secrets: secretsId,
        iexec_args: vArgs,
        ...(vEncryptResult ? { iexec_result_encryption: true } : {}),
      },
    });

    const requestorder = await iexec.order.signRequestorder(requestorderToSign);

    vOnStatusUpdate({
      title: 'CREATE_REQUEST_ORDER',
      isDone: true,
    });

    // Initialize variables for the matching loop
    let remainingVolume = volume;
    const allDealIds: string[] = [];
    const allTxHashes: string[] = [];

    vOnStatusUpdate({
      title: 'MATCH_ORDERS_LOOP',
      isDone: false,
      payload: {
        remainingVolume,
        totalVolume: volume,
      },
    });

    // While loop to match orders until volume is reached
    while (remainingVolume > 0) {
      // Fetch workerpool order
      const workerpoolorder = await iexec.orderbook
        .fetchWorkerpoolOrderbook({
          workerpool: vWorkerpool,
          app: vApp,
          dataset: NULL_ADDRESS, // For bulk requests, we don't specify a specific dataset
          requester: requester,
          isRequesterStrict: useVoucher,
          minTag: ['tee', 'scone'],
          maxTag: ['tee', 'scone'],
          category: 0,
        })
        .then((workerpoolOrderbook) => {
          const desiredPriceWorkerpoolOrder = filterWorkerpoolOrders({
            workerpoolOrders: workerpoolOrderbook.orders,
            workerpoolMaxPrice: vWorkerpoolMaxPrice,
            useVoucher: vUseVoucher,
            userVoucher,
          });
          return desiredPriceWorkerpoolOrder;
        });

      // If no workerpool order is available, wait and retry
      if (!workerpoolorder) {
        vOnStatusUpdate({
          title: 'WAITING_FOR_WORKERPOOL_ORDERS',
          isDone: false,
          payload: {
            remainingVolume,
            totalVolume: volume,
          },
        });

        // Wait 5 seconds before retrying
        await waitForRetry(5000);
        continue;
      }

      // Calculate the volume for this match (minimum of remaining volume and workerpool order volume)
      const matchVolume = Math.min(remainingVolume, workerpoolorder.volume);

      vOnStatusUpdate({
        title: 'REQUEST_TO_PROCESS_BULK_DATA',
        isDone: false,
        payload: {
          matchVolume,
          remainingVolume,
          totalVolume: volume,
        },
      });

      const orders = {
        requestorder,
        workerpoolorder: workerpoolorder,
        apporder: apporder,
      };

      const matchOptions: MatchOptions = {
        useVoucher: vUseVoucher,
        ...(vVoucherOwner ? { voucherAddress: userVoucher?.address } : {}),
      };

      const {
        dealid,
        txHash,
        volume: matchedVolume,
      } = await iexec.order.matchOrders(orders, matchOptions);

      // Store the match results
      allDealIds.push(dealid);
      allTxHashes.push(txHash);

      // Update remaining volume
      remainingVolume -= matchedVolume.toNumber();

      vOnStatusUpdate({
        title: 'REQUEST_TO_PROCESS_BULK_DATA',
        isDone: true,
        payload: {
          txHash: txHash,
          dealId: dealid,
          matchVolume: matchedVolume.toNumber(),
          remainingVolume,
          totalVolume: volume,
        },
      });

      // TODO: figure out how to retrieve results
      // vOnStatusUpdate({
      //   title: 'CONSUME_TASK',
      //   isDone: false,
      //   payload: {
      //     taskId: taskId,
      //     remainingVolume,
      //     totalVolume: volume,
      //   },
      // });

      // // Wait for task completion
      // const taskObservable = await iexec.task.obsTask(taskId, {
      //   dealid: dealid,
      // });
      // await new Promise((resolve, reject) => {
      //   taskObservable.subscribe({
      //     next: () => {},
      //     error: (e) => {
      //       reject(e);
      //     },
      //     complete: () => resolve(undefined),
      //   });
      // });

      // vOnStatusUpdate({
      //   title: 'CONSUME_TASK',
      //   isDone: true,
      //   payload: {
      //     taskId: taskId,
      //     remainingVolume,
      //     totalVolume: volume,
      //   },
      // });

      // // Get result from completed task
      // const { result } = await getResultFromCompletedTask({
      //   iexec,
      //   taskId,
      //   path: vPath,
      //   pemPrivateKey: privateKey,
      //   onStatusUpdate: vOnStatusUpdate,
      // });

      // allResults.push(result);
    }

    vOnStatusUpdate({
      title: 'MATCH_ORDERS_LOOP',
      isDone: true,
      payload: {
        totalMatches: allDealIds.length,
        totalVolume: volume,
      },
    });

    return {
      dealsIds: allDealIds,
      txHashes: allTxHashes,
      requestOrder: requestorder,
      ...(privateKey ? { pemPrivateKey: privateKey } : {}),
    };
  } catch (error) {
    console.error('[processBulkRequest] ERROR', error);
    handleIfProtocolError(error);
    throw new WorkflowError({
      message: processProtectedDataErrorMessage,
      errorCause: error,
    });
  }
};
