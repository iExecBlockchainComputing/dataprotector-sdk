import { WorkflowError } from '../utils/errors.js';
import { formatGrantedAccess } from '../utils/format.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  positiveIntegerStringSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { GrantAccessParams, GrantedAccess, IExecConsumer } from './types.js';

export const grantAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp,
  authorizedUser,
  pricePerAccess,
  numberOfAccess,
  tag,
}: IExecConsumer & GrantAccessParams): Promise<GrantedAccess> => {
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vAuthorizedApp = addressOrEnsSchema()
    .required()
    .label('authorizedApp')
    .validateSync(authorizedApp);
  const vAuthorizedUser = addressOrEnsOrAnySchema()
    .required()
    .label('authorizedUser')
    .validateSync(authorizedUser);
  const vPricePerAccess = positiveIntegerStringSchema()
    .label('pricePerAccess')
    .validateSync(pricePerAccess);
  const vNumberOfAccess = positiveStrictIntegerStringSchema()
    .label('numberOfAccess')
    .validateSync(numberOfAccess);
  const vTag = tag; // not validated, will be removed in near future

  try {
    const publishedDatasetOrders = await fetchGrantedAccess({
      iexec,
      protectedData: vProtectedData,
      authorizedApp: vAuthorizedApp,
      authorizedUser: vAuthorizedUser,
    });
    if (publishedDatasetOrders.length > 0) {
      throw new Error(
        'An access has been already granted to this user/application'
      );
    }
    const datasetorderTemplate = await iexec.order.createDatasetorder({
      dataset: vProtectedData,
      apprestrict: vAuthorizedApp,
      requesterrestrict: vAuthorizedUser,
      datasetprice: vPricePerAccess,
      volume: vNumberOfAccess,
      tag: vTag,
    });
    // todo: remove any after iexec sdk type fix
    const datasetorder: any = await iexec.order.signDatasetorder(
      datasetorderTemplate
    );
    await iexec.order.publishDatasetorder(datasetorder);
    return formatGrantedAccess(datasetorder);
  } catch (error) {
    throw new WorkflowError(`Failed to grant access: ${error.message}`, error);
  }
};
