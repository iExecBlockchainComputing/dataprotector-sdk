import {
  IExecConsumer,
  RevokeAllAccessParams,
  RevokeAllAccessMessage,
  ProtectDataMessage,
} from './types.js';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { Observable, SafeObserver } from '../utils/reactive.js';

const revokeAllAccess = ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  authorizedApp = 'any',
  authorizedUser = 'any',
}: IExecConsumer &
  RevokeAllAccessParams): Observable<RevokeAllAccessMessage> => {
  const observable = new Observable((observer) => {
    let abort = false;
    const safeObserver: SafeObserver<RevokeAllAccessMessage> = new SafeObserver(
      observer
    );
    const start = async () => {
      try {
        if (abort) return;
        const grantedAccess = await iexec.orderbook
          .fetchDatasetOrderbook(protectedData, {
            app: authorizedApp,
            requester: authorizedUser,
          })
          .catch((e) => {
            throw new WorkflowError(
              'Failed to fetch protected data from orderbook',
              e
            );
          });

        if (abort) return;
        safeObserver.next({
          message: 'GRANTED_ACCESS_RETRIVED',
          grantedAccess,
        });

        if (abort) return;
        if (!grantedAccess.orders.length) {
          safeObserver.error(new Error('No order to revoke'));
          return;
        }

        for (const el of grantedAccess.orders) {
          try {
            const { txHash, order } = await iexec.order.cancelDatasetorder(
              el.order
            );
            if (abort) return;
            safeObserver.next({
              message: 'ACCESS_SUCCESSFULLY_CANCELLED',
              txHash,
              order,
            });
          } catch (e) {
            throw new WorkflowError('Failed to cancel protected data order', e);
          }
        }

        safeObserver.complete();
      } catch (error) {
        if (error instanceof WorkflowError) {
          safeObserver.error(error);
        } else {
          safeObserver.error(
            new WorkflowError('revoke access unexpected error', error)
          );
        }
      }
    };

    safeObserver.unsub = () => {
      // teardown callback
      abort = true;
    };

    start();

    return safeObserver.unsubscribe.bind(safeObserver);
  });

  return observable;
};

export { revokeAllAccess };
