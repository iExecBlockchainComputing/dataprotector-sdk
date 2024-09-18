import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  RevokeAllAccessParams,
  RevokeAllAccessStatuses,
  RevokedAccess,
} from '../types/coreTypes.js';
import { OnStatusUpdateFn } from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getGrantedAccess } from './getGrantedAccess.js';
import { revokeOneAccess } from './revokeOneAccess.js';

export const revokeAllAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp,
  authorizedUser,
  onStatusUpdate = () => {},
}: IExecConsumer & RevokeAllAccessParams): Promise<RevokedAccess[]> => {
  const vProtectedData = addressOrEnsSchema()
    .label('protectedData')
    .validateSync(protectedData);
  const vAuthorizedApp = addressOrEnsSchema()
    .label('authorizedApp')
    .validateSync(authorizedApp);
  const vAuthorizedUser = addressOrEnsSchema()
    .label('authorizedUser')
    .validateSync(authorizedUser);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<OnStatusUpdateFn<RevokeAllAccessStatuses>>(
      onStatusUpdate
    );

  const allAccessRevoked: RevokedAccess[] = [];

  vOnStatusUpdate({
    title: 'RETRIEVE_ALL_GRANTED_ACCESS',
    isDone: false,
  });
  const { grantedAccess } = await getGrantedAccess({
    iexec,
    protectedData: vProtectedData,
    authorizedApp: vAuthorizedApp,
    authorizedUser: vAuthorizedUser,
  }).catch((e) => {
    throw new WorkflowError({
      message: 'Failed to retrieve granted access',
      errorCause: e,
    });
  });
  vOnStatusUpdate({
    title: 'RETRIEVE_ALL_GRANTED_ACCESS',
    isDone: true,
    payload: {
      grantedAccessCount: String(grantedAccess.length),
    },
  });

  for (const access of grantedAccess) {
    try {
      vOnStatusUpdate({
        title: 'REVOKE_ONE_ACCESS',
        isDone: false,
        payload: {
          access,
        },
      });
      const { txHash } = await revokeOneAccess({
        iexec,
        ...access,
      });
      allAccessRevoked.push({ access, txHash });
      vOnStatusUpdate({
        title: 'REVOKE_ONE_ACCESS',
        isDone: true,
        payload: {
          access,
          txHash,
        },
      });
    } catch (e) {
      throw new WorkflowError({
        message: 'Failed to revoke an access',
        errorCause: e,
      });
    }
  }

  return allAccessRevoked;
};
