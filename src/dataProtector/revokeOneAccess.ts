import { WorkflowError } from '../utils/errors.js';
import { grantedAccessSchema, throwIfMissing } from '../utils/validators.js';
import { IExecConsumer, GrantedAccess, RevokedAccess } from './types.js';

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
    throw new WorkflowError('Failed to revoke access', e);
  }
};
