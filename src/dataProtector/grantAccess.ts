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
import { IExec } from 'iexec';
import { id } from 'ethers/lib/utils.js';

// Define named constants for function selectors
const ADD_RESOURCE_SELECTOR = 'addResourceToWhitelist(address)';
const KEY_PURPOSE_SELECTOR = 'keyHasPurpose(bytes32,uint256)';

/**
 * Checks if a contract at the given address contains specific function selectors in its bytecode.
 *
 * @param iexec - The IExec instance.
 * @param appAddressOrWhitelist - The address of the contract to check.
 * @returns True if the contract contains the required function selectors; false otherwise.
 */
export const isDeployedWhitelist = async (
  iexec: IExec,
  whitelistAddress: string
): Promise<boolean> => {
  const contractClient = await iexec.config.resolveContractsClient();
  // Fetch the contract's bytecode
  const contractBytecode = await contractClient.provider.getCode(
    whitelistAddress
  );
  // Check if both function selectors are present in the bytecode
  const hasAddResourceSelector = contractBytecode.includes(
    id(ADD_RESOURCE_SELECTOR).substring(2, 10)
  );
  const hasKeyPurposeSelector = contractBytecode.includes(
    id(KEY_PURPOSE_SELECTOR).substring(2, 10)
  );
  return hasAddResourceSelector && hasKeyPurposeSelector;
};

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

  const publishedDatasetOrders = await fetchGrantedAccess({
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
