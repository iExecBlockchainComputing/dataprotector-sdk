import {
  FetchGrantedAccessParams,
  IExecConsumer,
  GrantedAccess,
  GrantedAccessResponse,
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
}: IExecConsumer &
  FetchGrantedAccessParams): Promise<GrantedAccessResponse> => {
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
    const { count, orders } = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vAuthorizedApp,
        requester: vAuthorizedUser,
        page,
        pageSize,
      }
    );
    const grantedAccess = orders?.map((order) =>
      formatGrantedAccess(order.order)
    );
    return { page, pageSize, count, grantedAccess };
  } catch (e) {
    throw new WorkflowError('Failed to fetch granted access', e);
  }
};
