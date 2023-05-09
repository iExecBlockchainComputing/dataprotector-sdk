import {
  IExecConsumer,
  RevokeAllAccessParams,
  RevokeAllAccessMessage,
} from './types.js';
import { WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { Observable, SafeObserver } from '../utils/reactive.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';

export const revokeAllAccessObservable = ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp = 'any',
  authorizedUser = 'any',
}: IExecConsumer &
  RevokeAllAccessParams): Observable<RevokeAllAccessMessage> => {
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vAuthorizedApp = addressOrEnsOrAnySchema()
    .required()
    .label('authorizedApp')
    .validateSync(authorizedApp);
  const vAuthorizedUser = addressOrEnsOrAnySchema()
    .required()
    .label('authorizedUser')
    .validateSync(authorizedUser);
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
          protectedData: vProtectedData,
          authorizedApp: vAuthorizedApp,
          authorizedUser: vAuthorizedUser,
        }).catch((e) => {
          throw new WorkflowError(
            'Failed to fetch protected data from orderbook',
            e
          );
        });

        if (abort) return;
        safeObserver.next({
          message: 'GRANTED_ACCESS_RETRIEVED',
          access: grantedAccess,
        });

        if (abort) return;
        for (const access of grantedAccess) {
          try {
            safeObserver.next({
              message: 'REVOKE_ONE_ACCESS_REQUEST',
              access,
            });
            const { txHash, order } = await iexec.order.cancelDatasetorder(
              access
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
