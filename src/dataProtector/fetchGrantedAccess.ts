import {
  FetchGrantedAccessParams,
  IExecConsumer,
  GrantedAccess,
} from './types.js';
import { WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { formatGrantedAccess } from '../utils/format.js';

export const fetchGrantedAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp = 'any',
  authorizedUser = 'any',
}: IExecConsumer & FetchGrantedAccessParams): Promise<GrantedAccess[]> => {
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
  try {
    const { orders } = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vAuthorizedApp,
        requester: vAuthorizedUser,
      }
    );
    const grantedAccess = orders?.map((order) =>
      formatGrantedAccess(order.order)
    );
    return grantedAccess;
  } catch (e) {
    throw new WorkflowError('Failed to fetch granted access', e);
  }
};
