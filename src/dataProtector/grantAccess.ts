import { GrantAccessParams, IExecConsumer } from './types.js';
import { WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  positiveIntegerStringSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';

export const grantAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp,
  authorizedUser,
  pricePerAccess,
  numberOfAccess,
  tag,
}: IExecConsumer & GrantAccessParams): Promise<string> => {
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
  const vNumberOfAccess = positiveIntegerStringSchema()
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
    const datasetorder = await iexec.order.signDatasetorder(
      datasetorderTemplate
    );
    const orderHash = await iexec.order.publishDatasetorder(datasetorder);
    return orderHash;
  } catch (error) {
    throw new WorkflowError(`Failed to grant access: ${error.message}`, error);
  }
};
