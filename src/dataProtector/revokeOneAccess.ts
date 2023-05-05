import { IExecConsumer, GrantedAccess, RevokedAccess } from './types.js';
import { WorkflowError } from '../utils/errors.js';
import { grantedAccessSchema, throwIfMissing } from '../utils/validators.js';

export const revokeOneAccess = async ({
  iexec = throwIfMissing(),
  ...grantedAccess // rest always gives an object
}: IExecConsumer & GrantedAccess): Promise<RevokedAccess> => {
  const vGrantedAccess = grantedAccessSchema()
    .required('The GrantedAccess to revoke is required')
    .validateSync(
      Object.keys(grantedAccess).length === 0 ? undefined : grantedAccess // pass undefined if rest operator returns an empty object to trigger the 'required' check
    ) as GrantedAccess;
  try {
    const { order, txHash } = await iexec.order.cancelDatasetorder(
      vGrantedAccess
    );
    return { access: order, txHash };
  } catch (error) {
    throw new WorkflowError(
      `Failed to cancel this granted access: ${error.message}`,
      error
    );
  }
};
