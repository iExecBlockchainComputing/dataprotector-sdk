import { ZeroAddress } from 'ethers';
import { DATASET_INFINITE_VOLUME, NULL_ADDRESS } from 'iexec/utils';
import { TEE_TAG } from '../../config/config.js';
import {
  ValidationError,
  WorkflowError,
  grantAccessErrorMessage,
  handleIfProtocolError,
} from '../../utils/errors.js';
import { formatGrantedAccess } from '../../utils/formatGrantedAccess.js';
import {
  addressOrEnsSchema,
  booleanSchema,
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

export const grantAccess = async ({
  iexec = throwIfMissing(),
  protectedData,
  authorizedApp,
  authorizedUser,
  pricePerAccess = 0,
  numberOfAccess,
  allowBulk = false,
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
  let vPricePerAccess = positiveIntegerStringSchema()
    .label('pricePerAccess')
    .validateSync(pricePerAccess);
  let vNumberOfAccess = positiveStrictIntegerStringSchema()
    .label('numberOfAccess')
    .validateSync(numberOfAccess);
  const vAllowBulk = booleanSchema().label('allowBulk').validateSync(allowBulk);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<OnStatusUpdateFn<GrantAccessStatuses>>(
      onStatusUpdate
    );

  // Validate consistency between allowBulk, pricePerAccess and numberOfAccess
  if (vAllowBulk) {
    if (vPricePerAccess && vPricePerAccess !== '0') {
      throw new ValidationError(
        'allowBulk requires pricePerAccess to be 0 or undefined'
      );
    }
    vPricePerAccess = '0';
    if (
      vNumberOfAccess &&
      vNumberOfAccess !== DATASET_INFINITE_VOLUME.toString()
    ) {
      throw new ValidationError(
        `allowBulk requires numberOfAccess to be ${DATASET_INFINITE_VOLUME.toString()} or undefined`
      );
    }
    vNumberOfAccess = DATASET_INFINITE_VOLUME.toString();
  }

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
        `An access has been already granted to the user: ${
          vAuthorizedUser || NULL_ADDRESS
        } with the app: ${vAuthorizedApp}`
      ),
    });
  }

  if (
    !(await iexec.app.checkDeployedApp(vAuthorizedApp)) &&
    !(await isERC734(iexec, vAuthorizedApp))
  ) {
    throw new WorkflowError({
      message: grantAccessErrorMessage,
      errorCause: Error(
        `Invalid authorized app address ${vAuthorizedApp}. No app or whitelist smart contract deployed at address.`
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
      tag: TEE_TAG,
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

  return formatGrantedAccess(datasetorder, parseInt(datasetorder.volume));
};
