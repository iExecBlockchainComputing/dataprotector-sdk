import { WorkflowError } from '../utils/errors.js';
import { Observable, SafeObserver } from '../utils/reactive.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { revokeOneAccess } from './revokeOneAccess.js';
import { AddressOrENS, GrantedAccess, IExecConsumer } from './types/shared.js';

export type RevokeAllAccessParams = {
  /**
   * Protected Data address or ENS
   */
  protectedData: AddressOrENS;
  /**
   * Address or ENS of the app authorized to use the `protectedData`
   *
   * Default revoke for any app
   */
  authorizedApp?: AddressOrENS | 'any';
  /**
   * Address or ENS of the user authorized to use the `protectedData`
   *
   * Default revoke for any user
   */
  authorizedUser?: AddressOrENS | 'any';
};

type RevokeAllAccessRevokeRequestMessage = {
  message: 'REVOKE_ONE_ACCESS_REQUEST';
  access: GrantedAccess;
};

type RevokeAllAccessRevokeSuccessMessage = {
  message: 'REVOKE_ONE_ACCESS_SUCCESS';
  txHash: string;
  access: GrantedAccess;
};

type RevokeAllAccessRetrievedAccessMessage = {
  message: 'GRANTED_ACCESS_RETRIEVED';
  access: GrantedAccess[];
};

export type RevokeAllAccessMessage =
  | RevokeAllAccessRevokeRequestMessage
  | RevokeAllAccessRevokeSuccessMessage
  | RevokeAllAccessRetrievedAccessMessage;

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
  return new Observable<RevokeAllAccessMessage>((observer) => {
    let abort = false;
    const safeObserver: SafeObserver<RevokeAllAccessMessage> = new SafeObserver(
      observer
    );
    const start = async () => {
      try {
        if (abort) return;
        const { grantedAccess } = await fetchGrantedAccess({
          iexec,
          protectedData: vProtectedData,
          authorizedApp: vAuthorizedApp,
          authorizedUser: vAuthorizedUser,
        }).catch((e) => {
          throw new WorkflowError('Failed to retrieve granted access', e);
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
            const { txHash, access: revokedAccess } = await revokeOneAccess({
              iexec,
              ...access,
            });
            safeObserver.next({
              message: 'REVOKE_ONE_ACCESS_SUCCESS',
              txHash,
              access: revokedAccess,
            });
          } catch (e) {
            throw new WorkflowError('Failed to revoke an access', e);
          }
        }

        safeObserver.complete();
      } catch (e) {
        if (e instanceof WorkflowError) {
          safeObserver.error(e);
        } else {
          safeObserver.error(
            new WorkflowError('Revoke access unexpected error', e)
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
};
