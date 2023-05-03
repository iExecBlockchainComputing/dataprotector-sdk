import {
  IExecConsumer,
  RevokeAllAccessParams,
  RevokeAllAccessMessage,
} from './types.js';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { Observable, SafeObserver } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';

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
        const grantedAccess = await fetchGrantedAccess({
          iexec,
          protectedData,
          authorizedApp,
          authorizedUser,
        }).catch((e) => {
          throw new WorkflowError(
            'Failed to fetch protected data from orderbook',
            e
          );
        });

        if (abort) return;
        safeObserver.next({
          message: 'GRANTED_ACCESS_RETRIEVED',
          grantedAccess,
        });

        if (abort) return;
        for (const _order of grantedAccess) {
          try {
            safeObserver.next({
              message: 'REVOKE_ONE_ACCESS_REQUEST',
              access: _order,
            });
            const { txHash, order } = await iexec.order.cancelDatasetorder(
              _order
            );
            if (abort) return;
            safeObserver.next({
              message: 'REVOKE_ONE_ACCESS_SUCCESS',
              txHash,
              access: order,
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
            new WorkflowError('Revoke access unexpected error', error)
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
