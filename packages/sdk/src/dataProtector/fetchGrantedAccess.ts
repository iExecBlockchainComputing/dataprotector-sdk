import { WorkflowError } from '../utils/errors.js';
import { formatGrantedAccess } from '../utils/format.js';
import {
  addressOrEnsOrAnySchema,
  booleanSchema,
  throwIfMissing,
} from '../utils/validators.js';
import {
  FetchGrantedAccessParams,
  IExecConsumer,
  GrantedAccessResponse,
} from './types.js';

export const fetchGrantedAccess = async ({
  iexec = throwIfMissing(),
  protectedData = 'any',
  authorizedApp = 'any',
  authorizedUser = 'any',
  isAppStrict = false,
  isRequesterStrict = false,
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
  const vIsAppStrict = booleanSchema()
    .label('isAppStrict')
    .validateSync(isAppStrict);
  const vIsRequesterStrict = booleanSchema()
    .label('isRequesterStrict')
    .validateSync(isRequesterStrict);
  try {
    const { count, orders } = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vAuthorizedApp,
        requester: vAuthorizedUser,
        isAppStrict: vIsAppStrict,
        isRequesterStrict: vIsRequesterStrict,
        page,
        pageSize,
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
