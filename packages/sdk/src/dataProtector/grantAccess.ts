import { WorkflowError } from '../utils/errors.js';
import { formatGrantedAccess } from '../utils/format.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  positiveIntegerStringSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { isDeployedWhitelist } from '../utils/whitelist.js';
import { fetchGrantedAccess } from './fetchGrantedAccess.js';
import { AddressOrENS, GrantedAccess, IExecConsumer } from './types/shared.js';

export type GrantAccessParams = {
  /**
   * Protected Data address or ENS
   */
  protectedData: AddressOrENS;
  /**
   * Address or ENS of the app authorized to use the `protectedData`
   */
  authorizedApp: AddressOrENS;
  /**
   * Address or ENS of the user authorized to use the `protectedData`
   *
   * The address zero `0x0000000000000000000000000000000000000000` can be use to authorize any user to use the `protectedData`.
   */
  authorizedUser: AddressOrENS;
  /**
   * Price paid by the `authorizedUser` per access to the `protectedData` labeled in nRLC.
   */
  pricePerAccess?: number;
  /**
   * Total number of access to the `protectedData` for the generated authorization.
   */
  numberOfAccess?: number;
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

  const { grantedAccess: publishedDatasetOrders } = await fetchGrantedAccess({
    iexec,
    protectedData: vProtectedData,
    authorizedApp: vAuthorizedApp,
    authorizedUser: vAuthorizedUser,
  }).catch((e) => {
    throw new WorkflowError('Failed to check granted access', e);
  });
  if (publishedDatasetOrders.length > 0) {
    throw new WorkflowError(
      'An access has been already granted to this user with this app'
    );
  }

  let tag;
  const isDeployedApp = await iexec.app.checkDeployedApp(authorizedApp);
  if (isDeployedApp) {
    tag = await iexec.app.showApp(authorizedApp).then(({ app }) => {
      return inferTagFromAppMREnclave(app.appMREnclave);
    });
  } else if (await isDeployedWhitelist(iexec, authorizedApp)) {
    tag = ['tee', 'scone'];
  } else {
    throw new WorkflowError('Failed to detect the app TEE framework');
  }

  const datasetorder = await iexec.order
    .createDatasetorder({
      dataset: vProtectedData,
      apprestrict: vAuthorizedApp,
      requesterrestrict: vAuthorizedUser,
      datasetprice: vPricePerAccess,
      volume: vNumberOfAccess,
      tag,
    })
    .then((datasetorderTemplate) =>
      iexec.order.signDatasetorder(datasetorderTemplate)
    )
    .catch((e) => {
      throw new WorkflowError('Failed to sign data access', e);
    });
  await iexec.order.publishDatasetorder(datasetorder).catch((e) => {
    throw new WorkflowError('Failed to publish data access', e);
  });
  return formatGrantedAccess(datasetorder);
};

export const inferTagFromAppMREnclave = (mrenclave: string) => {
  const tag = ['tee'];
  try {
    const { framework } = JSON.parse(mrenclave);
    if (framework.toLowerCase() === 'scone') {
      tag.push('scone');
      return tag;
    }
  } catch (e) {
    // noop
  }
  throw Error('App does not use a supported TEE framework');
};
