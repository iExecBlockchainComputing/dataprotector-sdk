import { utils } from 'iexec';
import { WorkflowError, handleIfProtocolError } from '../../utils/errors.js';
import { formatGrantedAccess } from '../../utils/formatGrantedAccess.js';
import {
  addressOrEnsSchema,
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
  protectedData,
  authorizedApp,
  authorizedUser,
  isUserStrict = false,
  page,
  pageSize,
  bulkOnly = false,
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
  const vIsUserStrict = booleanSchema()
    .label('isUserStrict')
    .validateSync(isUserStrict);
  const vPage = positiveNumberSchema().label('page').validateSync(page);
  const vPageSize = numberBetweenSchema(10, 1000)
    .label('pageSize')
    .validateSync(pageSize);
  const vBulkOnly = booleanSchema().label('bulkOnly').validateSync(bulkOnly);

  try {
    const { count, orders } = await iexec.orderbook.fetchDatasetOrderbook({
      dataset: vProtectedData || 'any',
      app: vAuthorizedApp || 'any',
      requester: vAuthorizedUser || 'any',
      isRequesterStrict: vIsUserStrict,
      isAppStrict: true,
      page: vPage,
      pageSize: vPageSize,
    });
    let grantedAccess = orders?.map((order) =>
      formatGrantedAccess(order.order, order.remaining)
    );

    // Filter for bulk orders if bulkOnly is true
    if (vBulkOnly && grantedAccess) {
      grantedAccess = grantedAccess.filter(
        (access) => access.volume === utils.DATASET_INFINITE_VOLUME.toString()
      );
    }

    return { count, grantedAccess };
  } catch (e) {
    handleIfProtocolError(e);
    throw new WorkflowError({
      message: 'Failed to fetch granted access',
      errorCause: e,
    });
  }
};
