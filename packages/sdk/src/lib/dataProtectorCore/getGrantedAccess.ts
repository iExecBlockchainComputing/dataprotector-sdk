import { WorkflowError } from '../../utils/errors.js';
import { formatGrantedAccess } from '../../utils/format.js';
import {
  addressOrEnsSchema,
  numberBetweenSchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  GetGrantedAccessParams,
  GrantedAccessResponse,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export const getGrantedAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp,
  authorizedUser,
  page,
  pageSize,
}: IExecConsumer & GetGrantedAccessParams): Promise<GrantedAccessResponse> => {
  const vProtectedData = addressOrEnsSchema()
    .label('protectedData')
    .validateSync(protectedData);
  const vAuthorizedApp = addressOrEnsSchema()
    .label('authorizedApp')
    .validateSync(authorizedApp);
  const vAuthorizedUser = addressOrEnsSchema()
    .label('authorizedUser')
    .validateSync(authorizedUser);
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);

  try {
    const { count, orders } = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData || 'any',
      {
        app: vAuthorizedApp || 'any',
        requester: vAuthorizedUser || 'any',
        page: vPage,
        pageSize: vPageSize,
      }
    );
    const grantedAccess = orders?.map((order) =>
      formatGrantedAccess(order.order)
    );
    return { count, grantedAccess };
  } catch (e) {
    throw new WorkflowError('Failed to fetch granted access', e);
  }
};
