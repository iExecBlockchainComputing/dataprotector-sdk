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
    const grantedAccess = orders?.map((el) =>
      Object.fromEntries(
        Object.entries(el.order).map(([key, val]) => [key, val.toString()]) // stringify numbers to have simplify GrantedAccess type
      )
    ) as GrantedAccess[];
    return grantedAccess;
  } catch (error) {
    throw new WorkflowError(
      `Failed to fetch granted access to this data: ${error.message}`,
      error
    );
  }
};
