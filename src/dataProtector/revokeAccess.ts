import { NULL_ADDRESS } from '../config';
import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { RevokeAccessOptions } from './types';

export const revokeAccess = async ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  apprestrict = NULL_ADDRESS,
  workerpoolrestrict = NULL_ADDRESS,
  requesterrestrict = NULL_ADDRESS,
}: RevokeAccessOptions): Promise<string[]> => {
  try {
    const publishedDatasetOrders = await iexec.orderbook.fetchDatasetOrderbook(
      dataset,
      {
        app: apprestrict,
        workerpool: workerpoolrestrict,
        requester: requesterrestrict,
      }
    );
    const cancelledOrdersTxHash = await Promise.all(
      publishedDatasetOrders.orders.map(
        async (order) => await iexec.order.cancelDatasetorder(order.order)
      )
    );
    if (!cancelledOrdersTxHash.length) {
      throw new Error('No order to revoke');
    }
    return cancelledOrdersTxHash;
  } catch (e: any) {
    if (e instanceof WorkflowError) {
      throw e;
    } else {
      throw new WorkflowError('Order publish unexpected error', e);
    }
  }
};
