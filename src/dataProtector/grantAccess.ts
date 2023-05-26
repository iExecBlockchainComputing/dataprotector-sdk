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

export const inferTagFromAppMREnclave = (mrenclave: string) => {
  const tag = ['tee'];
  try {
    const { framework } = JSON.parse(mrenclave);
    switch (framework.toLowerCase()) {
      case 'scone':
        tag.push('scone');
        return tag;
      case 'gramine':
        tag.push('gramine');
        return tag;
      default:
        break;
    }
  } catch (e) {
    // noop
  }
  throw Error('App does not use a supported TEE framework');
};

export const grantAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp,
  authorizedUser,
  pricePerAccess,
  numberOfAccess,
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
    const { app } = await iexec.app.showApp(vAuthorizedApp);
    const mrenclave = (app as any).appMREnclave; // todo: remove `as any` when iexec sdk type is fixed
    const tag = inferTagFromAppMREnclave(mrenclave);

    const datasetorderTemplate = await iexec.order.createDatasetorder({
      dataset: vProtectedData,
      apprestrict: vAuthorizedApp,
      requesterrestrict: vAuthorizedUser,
      datasetprice: vPricePerAccess,
      volume: vNumberOfAccess,
      tag,
    });
    const datasetorder = await iexec.order.signDatasetorder(
      datasetorderTemplate
    );
    await iexec.order.publishDatasetorder(datasetorder);
    return formatGrantedAccess(datasetorder);
  } catch (error) {
    throw new Error(`Failed to grant access: ${error.message}`);
  }
};
