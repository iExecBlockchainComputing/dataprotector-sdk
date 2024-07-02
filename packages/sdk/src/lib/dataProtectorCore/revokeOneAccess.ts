import { WorkflowError } from '../../utils/errors.js';
import { grantedAccessSchema, throwIfMissing } from '../../utils/validators.js';
import { GrantedAccess, RevokedAccess } from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export const revokeOneAccess = async ({
  iexec = throwIfMissing(),
  ...grantedAccess // rest always gives an object
}: IExecConsumer & GrantedAccess): Promise<RevokedAccess> => {
  const vGrantedAccess = grantedAccessSchema()
    .required('The GrantedAccess is required to be revoked')
    .validateSync(
      Object.keys(grantedAccess).length === 0 ? undefined : grantedAccess // pass undefined if rest operator returns an empty object to trigger the 'required' check
    ) as GrantedAccess;
  try {
    const { txHash } = await iexec.order.cancelDatasetorder(vGrantedAccess);
    return { access: vGrantedAccess, txHash };
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to revoke access',
      errorCause: e,
    });
  }
};
