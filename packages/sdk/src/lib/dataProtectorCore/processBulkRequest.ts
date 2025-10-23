import { sumTags } from 'iexec/utils';
import { SCONE_TAG } from '../../config/config.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
  handleIfProtocolError,
  ValidationError,
} from '../../utils/errors.js';
import {
  checkUserVoucher,
  filterWorkerpoolOrders,
} from '../../utils/processProtectedData.models.js';
import {
  addressOrEnsSchema,
  booleanSchema,
  bulkRequestSchema,
  stringSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  BulkRequest,
  DefaultWorkerpoolConsumer,
  MatchOptions,
  OnStatusUpdateFn,
  ProcessBulkRequestParams,
  ProcessBulkRequestResponse,
  ProcessBulkRequestStatuses,
} from '../types/index.js';
import { IExecConsumer, VoucherInfo } from '../types/internalTypes.js';

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
  bulkRequest,
  workerpool,
  useVoucher = false,
  voucherOwner,
  pemPrivateKey,
  onStatusUpdate = () => {},
}: IExecConsumer &
  DefaultWorkerpoolConsumer &
  ProcessBulkRequestParams): Promise<ProcessBulkRequestResponse> => {
  const vRequestorder = bulkRequestSchema()
    .label('bulkRequest')
    .required()
    .validateSync(bulkRequest) as BulkRequest; // Type assertion after validation
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
  const vPemPrivateKey = stringSchema()
    .label('pemPrivateKey')
    .validateSync(pemPrivateKey);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<ProcessBulkRequestStatuses>
    >(onStatusUpdate);

  // Validate that pemPrivateKey is provided if iexec_result_encryption is true
  if (
    // JSON parse safe thanks to bulkRequestSchema validation
    JSON.parse(vRequestorder.params)?.iexec_result_encryption === true &&
    !vPemPrivateKey
  ) {
    throw new ValidationError(
      'Missing pemPrivateKey required for result decryption'
    );
  }

  try {
    let userVoucher: VoucherInfo | undefined;
    if (vUseVoucher) {
      try {
        userVoucher = await iexec.voucher.showUserVoucher(
          vVoucherOwner || vRequestorder.requester
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
      .fetchAppOrderbook({
        app: vRequestorder.app,
        minTag: SCONE_TAG,
        maxTag: SCONE_TAG,
        workerpool: vWorkerpool,
      })
      .then((appOrderbook) => {
        const desiredPriceAppOrderbook = appOrderbook.orders.filter(
          (order) => order.order.appprice <= Number(vRequestorder.appmaxprice)
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

    const volume = Number(vRequestorder.volume);
    const requestorderHash = await iexec.order.hashRequestorder(vRequestorder);

    const getRemainingVolume = async (): Promise<number> => {
      const contractsClient = await iexec.config.resolveContractsClient();
      const poco = contractsClient.getIExecContract();
      const consumed = (await poco.viewConsumed(requestorderHash)) as bigint;
      return volume - Number(consumed);
    };

    vOnStatusUpdate({
      title: 'MATCH_ORDERS_LOOP',
      isDone: false,
      payload: {
        remainingVolume: await getRemainingVolume(),
        totalVolume: volume,
      },
    });

    // While loop to match orders until volume is reached
    let remainingVolume: number;
    while ((remainingVolume = await getRemainingVolume()) > 0) {
      // Fetch workerpool order
      const workerpoolorder = await iexec.orderbook
        .fetchWorkerpoolOrderbook({
          workerpool: vWorkerpool,
          app: vRequestorder.app,
          dataset: vRequestorder.dataset, // For bulk requests, we don't specify a specific dataset
          requester: vRequestorder.requester,
          isRequesterStrict: useVoucher,
          minTag: sumTags([apporder.tag, vRequestorder.tag]),
          category: 0,
        })
        .then((workerpoolOrderbook) => {
          const desiredPriceWorkerpoolOrder = filterWorkerpoolOrders({
            workerpoolOrders: workerpoolOrderbook.orders,
            workerpoolMaxPrice: Number(vRequestorder.workerpoolmaxprice),
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

      const orders = {
        requestorder: vRequestorder,
        workerpoolorder: workerpoolorder,
        apporder: apporder,
      };

      const matchOptions: MatchOptions = {
        useVoucher: vUseVoucher,
        ...(vVoucherOwner ? { voucherAddress: userVoucher?.address } : {}),
      };

      const {
        volume: matchableVolume,
        total,
        sponsored,
      } = await iexec.order.estimateMatchOrders(orders, matchOptions);

      vOnStatusUpdate({
        title: 'REQUEST_TO_PROCESS_BULK_DATA',
        isDone: false,
        payload: {
          cost: total.toString(),
          sponsoredCost: vUseVoucher ? sponsored.toString() : undefined,
          remainingVolume,
          matchVolume: matchableVolume.toNumber(),
          totalVolume: volume,
        },
      });

      const {
        dealid,
        txHash,
        volume: matchedVolume,
      } = await iexec.order.matchOrders(orders, matchOptions);

      vOnStatusUpdate({
        title: 'REQUEST_TO_PROCESS_BULK_DATA',
        isDone: true,
        payload: {
          txHash: txHash,
          dealId: dealid,
          matchVolume: matchedVolume.toNumber(),
          totalVolume: volume,
        },
      });
    }

    const { deals } = await iexec.deal.fetchDealsByRequestorder(
      requestorderHash,
      { pageSize: Math.max(volume, 10) } // Fetch all deals (min page size 10)
    );

    const tasks: Array<{
      taskId: string;
      dealId: string;
      bulkIndex: number;
    }> = [];

    for (const deal of deals) {
      const dealTasks = await Promise.all(
        new Array(deal.botSize)
          .fill(deal.botFirst)
          .map(async (botFirst, i) => ({
            taskId: await iexec.deal.computeTaskId(deal.dealid, botFirst + i),
            dealId: deal.dealid,
            bulkIndex: botFirst + i,
          }))
      );
      tasks.push(...dealTasks);
    }

    vOnStatusUpdate({
      title: 'MATCH_ORDERS_LOOP',
      isDone: true,
      payload: {
        totalMatches: deals.length,
        totalVolume: volume,
      },
    });

    return {
      tasks: tasks.sort((a, b) => a.bulkIndex - b.bulkIndex),
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
