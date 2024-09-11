import { ZeroAddress } from 'ethers';
import {
  ValidationError,
  WorkflowError,
  grantAccessErrorMessage,
  handleIfProtocolError,
} from '../../utils/errors.js';
import { formatGrantedAccess } from '../../utils/formatGrantedAccess.js';
import {
  addressOrEnsSchema,
  isEnsTest,
  positiveIntegerStringSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import { isERC734 } from '../../utils/whitelist.js';
import {
  GrantAccessParams,
  GrantAccessStatuses,
  GrantedAccess,
  OnStatusUpdateFn,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';
import { getGrantedAccess } from './getGrantedAccess.js';

const inferTagFromAppMREnclave = (mrenclave: string) => {
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
  throw new WorkflowError({
    message: grantAccessErrorMessage,
    errorCause: Error('App does not use a supported TEE framework'),
  });
};

export const grantAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp,
  authorizedUser,
  pricePerAccess,
  numberOfAccess,
  onStatusUpdate = () => {},
}: IExecConsumer & GrantAccessParams): Promise<GrantedAccess> => {
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  let vAuthorizedApp = addressOrEnsSchema()
    .required()
    .label('authorizedApp')
    .validateSync(authorizedApp);
  const vAuthorizedUser = addressOrEnsSchema()
    .label('authorizedUser')
    .validateSync(authorizedUser);
  const vPricePerAccess = positiveIntegerStringSchema()
    .label('pricePerAccess')
    .validateSync(pricePerAccess);
  const vNumberOfAccess = positiveStrictIntegerStringSchema()
    .label('numberOfAccess')
    .validateSync(numberOfAccess);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<OnStatusUpdateFn<GrantAccessStatuses>>(
      onStatusUpdate
    );

  if (vAuthorizedApp && isEnsTest(vAuthorizedApp)) {
    const resolved = await iexec.ens.resolveName(vAuthorizedApp);
    if (!resolved) {
      throw new ValidationError('authorizedApp ENS name is not valid');
    }
    vAuthorizedApp = resolved.toLowerCase();
  }

  if (vAuthorizedApp === ZeroAddress) {
    throw Error(
      `Forbidden to use ${ZeroAddress} as authorizedApp, this would give access to any app`
    );
  }

  const { grantedAccess: publishedDatasetOrders } = await getGrantedAccess({
    iexec,
    protectedData: vProtectedData,
    authorizedApp: vAuthorizedApp,
    authorizedUser: vAuthorizedUser,
    isUserStrict: true,
  });

  if (publishedDatasetOrders.length > 0) {
    throw new WorkflowError({
      message: grantAccessErrorMessage,
      errorCause: Error(
        `An access has been already granted to the user: ${vAuthorizedUser} with the app: ${vAuthorizedApp}`
      ),
    });
  }

  let tag;
  const isDeployedApp = await iexec.app.checkDeployedApp(authorizedApp);
  if (isDeployedApp) {
    tag = await iexec.app.showApp(authorizedApp).then(({ app }) => {
      return inferTagFromAppMREnclave(app.appMREnclave);
    });
  } else if (await isERC734(iexec, authorizedApp)) {
    tag = ['tee', 'scone'];
  } else {
    throw new WorkflowError({
      message: grantAccessErrorMessage,
      errorCause: Error(
        `Invalid app set for address ${authorizedApp}. The app either has an invalid tag (possibly non-TEE) or an invalid whitelist smart contract address.`
      ),
    });
  }

  vOnStatusUpdate({
    title: 'CREATE_DATASET_ORDER',
    isDone: false,
  });
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
      throw new WorkflowError({
        message: 'Failed to sign data access',
        errorCause: e,
      });
    });
  vOnStatusUpdate({
    title: 'CREATE_DATASET_ORDER',
    isDone: true,
  });

  vOnStatusUpdate({
    title: 'PUBLISH_DATASET_ORDER',
    isDone: false,
  });
  await iexec.order.publishDatasetorder(datasetorder).catch((e) => {
    handleIfProtocolError(e);
    throw new WorkflowError({
      message: 'Failed to publish data access',
      errorCause: e,
    });
  });
  vOnStatusUpdate({
    title: 'PUBLISH_DATASET_ORDER',
    isDone: true,
  });

  return formatGrantedAccess(datasetorder);
};
