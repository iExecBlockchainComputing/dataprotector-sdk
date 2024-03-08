import { WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  RevokeAllAccessParams,
  AllAccessRevoked,
  RevokedAccess,
} from '../types/dataProtectorTypes.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getGrantedAccess } from './getGrantedAccess.js';
import { revokeOneAccess } from './revokeOneAccess.js';

export const revokeAllAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp = 'any',
  authorizedUser = 'any',
  onStatusUpdate = () => {},
}: IExecConsumer & RevokeAllAccessParams): Promise<AllAccessRevoked> => {
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

  const allAccessRevoked: RevokedAccess[] = [];

  try {
    onStatusUpdate({
      title: 'RETRIEVE_ALL_GRANTED_ACCESS',
      isDone: false,
    });
    const { grantedAccess } = await getGrantedAccess({
      iexec,
      protectedData: vProtectedData,
      authorizedApp: vAuthorizedApp,
      authorizedUser: vAuthorizedUser,
    }).catch((e) => {
      throw new WorkflowError('Failed to retrieve granted access', e);
    });
    onStatusUpdate({
      title: 'RETRIEVE_ALL_GRANTED_ACCESS',
      isDone: true,
      payload: {
        grantedAccessCount: String(grantedAccess.length),
      },
    });

    for (const access of grantedAccess) {
      try {
        onStatusUpdate({
          title: 'REVOKE_ONE_ACCESS',
          isDone: false,
          payload: {
            requesterAddress: access.requesterrestrict.toLowerCase(),
          },
        });
        const { txHash } = await revokeOneAccess({
          iexec,
          ...access,
        });
        allAccessRevoked.push({ access, txHash });
        onStatusUpdate({
          title: 'REVOKE_ONE_ACCESS',
          isDone: true,
          payload: {
            requesterAddress: access.requesterrestrict.toLowerCase(),
            txHash,
          },
        });
      } catch (e) {
        throw new WorkflowError('Failed to revoke an access', e);
      }
    }

    return { allAccessRevoked };
  } catch (e) {
    if (e instanceof WorkflowError) {
      throw e;
    } else {
      throw new WorkflowError('Revoke access unexpected error', e);
    }
  }
};
