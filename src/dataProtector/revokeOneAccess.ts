import { IExecConsumer, GrantedAccess, RevokedAccess } from './types.js';
import { WorkflowError } from '../utils/errors.js';
import { grantedAccessSchema, throwIfMissing } from '../utils/validators.js';

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
  } catch (error) {
    throw new WorkflowError(
      `Failed to cancel this granted access: ${error.message}`,
      error
    );
  }
};
