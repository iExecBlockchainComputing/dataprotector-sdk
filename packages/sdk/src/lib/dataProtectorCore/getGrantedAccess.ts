import { WorkflowError, handleIfProtocolError } from '../../utils/errors.js';
import { formatGrantedAccess } from '../../utils/format.js';
import {
  addressOrEnsOrAnySchema,
  booleanSchema,
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
  protectedData = 'any',
  authorizedApp = 'any',
  authorizedUser = 'any',
  isUserStrict = false,
  page,
  pageSize,
}: IExecConsumer & GetGrantedAccessParams): Promise<GrantedAccessResponse> => {
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
  const vIsUserStrict = booleanSchema()
    .label('isUserStrict')
    .validateSync(isUserStrict);
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);

  try {
    console.log(vIsUserStrict);
    const { count, orders } = await iexec.orderbook.fetchDatasetOrderbook(
      vProtectedData,
      {
        app: vAuthorizedApp,
        requester: vAuthorizedUser,
        isRequesterStrict: vIsUserStrict,
        page: vPage,
        pageSize: vPageSize,
      }
    );
    const grantedAccess = orders?.map((order) =>
      formatGrantedAccess(order.order)
    );
    return { count, grantedAccess };
  } catch (e) {
    handleIfProtocolError(e);
    throw new WorkflowError({
      message: 'Failed to fetch granted access',
      errorCause: e,
    });
  }
};
