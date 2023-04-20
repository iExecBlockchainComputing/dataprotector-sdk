import { NULL_ADDRESS } from '../config';
import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { IExecConsumer, RevokeAccessOptions } from './types';
import { Observable } from '../utils/reactive';

export const revokeAccess = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  apprestrict = 'any',
  requesterrestrict = 'any',
}: IExecConsumer & RevokeAccessOptions): Observable => {
  return new Observable(async (subscriber) => {
    try {
      const publishedDatasetOrders =
        await iexec.orderbook.fetchDatasetOrderbook(dataset, {
          app: apprestrict,
          requester: requesterrestrict,
        });
      if (!publishedDatasetOrders.orders.length) {
        subscriber.error(new Error('no order to revoke'));
        return;
      }
      publishedDatasetOrders.orders.forEach(async (el) => {
        const { txHash, order } = await iexec.order.cancelDatasetorder(
          el.order
        );
        subscriber.next({
          message: 'ACCESS_SUCCESSFULLY_CANCELLED',
          txHash,
          order,
        });
      });
      subscriber.complete();
    } catch (error) {
      if (error instanceof WorkflowError) {
        subscriber.error(error);
      } else {
        subscriber.error(
          new WorkflowError('revoke access unexpected error', error)
        );
      }
    }
  });
};
