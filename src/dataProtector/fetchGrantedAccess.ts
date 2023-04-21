import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { GrantAccessParams, IExecConsumer, Order } from './types';

export const fetchGrantedAccess = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  authorizedApp = 'any',
  authorizedUser = 'any',
}: IExecConsumer & GrantAccessParams): Promise<Order[]> => {
  try {
    const { orders } = await iexec.orderbook.fetchDatasetOrderbook(
      protectedData,
      {
        app: authorizedApp,
        requester: authorizedUser,
      }
    );
    const grantedAccess = orders?.map((el) => el.order);
    return grantedAccess;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch granted access to this data: ${error.message}`,
      error
    );
  }
};
