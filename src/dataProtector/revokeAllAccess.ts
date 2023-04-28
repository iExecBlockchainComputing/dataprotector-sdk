import { IExecConsumer, RevokeAllAccessParams } from './types.js';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { Observable } from '../utils/reactive.js';

export const revokeAllAccess = ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  authorizedApp = 'any',
  authorizedUser = 'any',
}: IExecConsumer & RevokeAllAccessParams): Observable<any> => {
  //  todo: create revoke access messages types
  return new Observable(async (subscriber) => {
    try {
      const publishedDatasetOrders =
        await iexec.orderbook.fetchDatasetOrderbook(protectedData, {
          app: authorizedApp,
          requester: authorizedUser,
        });
      if (!publishedDatasetOrders.orders.length) {
        subscriber.error(new Error('No order to revoke'));
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
