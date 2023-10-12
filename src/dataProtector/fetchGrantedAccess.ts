import {
  FetchGrantedAccessParams,
  IExecConsumer,
  GrantedAccess,
} from './types.js';
import { WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../utils/validators.js';
import { formatGrantedAccess } from '../utils/format.js';

export const fetchGrantedAccess = async ({
  iexec = throwIfMissing(),
  protectedData = 'any',
  authorizedApp = 'any',
  authorizedUser = 'any',
  page,
  pageSize,
}: IExecConsumer & FetchGrantedAccessParams): Promise<GrantedAccess[]> => {
  const vProtectedData = addressOrEnsOrAnySchema()
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
  try {
    const { orders } = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vAuthorizedApp,
        requester: vAuthorizedUser,
        page,
        pageSize,
      }
    );
    return orders?.map((order) => formatGrantedAccess(order.order));
  } catch (e) {
    throw new WorkflowError('Failed to fetch granted access', e);
  }
};
