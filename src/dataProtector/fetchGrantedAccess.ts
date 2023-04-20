import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { GrantAccessOptions, IExecConsumer, Order } from './types';

export const fetchGrantedAccess = async ({
  iexec = throwIfMissing(),
  dataAddress = throwIfMissing(),
  appRestrictAddress = 'any',
  requesterRestrictAddress = 'any',
}: IExecConsumer & GrantAccessOptions): Promise<Order[]> => {
  try {
    const { orders } = await iexec.orderbook.fetchDatasetOrderbook(
      dataAddress,
      {
        app: appRestrictAddress,
        requester: requesterRestrictAddress,
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
