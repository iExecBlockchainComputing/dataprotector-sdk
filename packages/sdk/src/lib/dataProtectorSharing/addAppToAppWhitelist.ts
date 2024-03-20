import { WorkflowError } from '../../utils/errors.js';
import { resolveENS } from '../../utils/resolveENS.js';
import {
  addressOrEnsSchema,
  addressSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import { IExecConsumer } from '../types/internalTypes.js';
import {
  SharingContractConsumer,
  SuccessWithTransactionHash,
  AddAppToAppWhitelistParams,
} from '../types/sharingTypes.js';
import { getAppWhitelistContract } from './smartContract/getAppWhitelistContract.js';
import { getAppWhitelistRegistryContract } from './smartContract/getAppWhitelistRegistryContract.js';
import { getPocoAppRegistryContract } from './smartContract/getPocoRegistryContract.js';
import {
  onlyAppNotInAppWhitelist,
  onlyAppOwnedBySharingContract,
  onlyAppWhitelistRegisteredAndManagedByOwner,
} from './smartContract/preflightChecks.js';

export const addAppToAppWhitelist = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  appWhitelist,
  app,
}: IExecConsumer &
  SharingContractConsumer &
  AddAppToAppWhitelistParams): Promise<SuccessWithTransactionHash> => {
  const vAppWhitelist = addressSchema()
    .required()
    .label('appWhitelist')
    .validateSync(appWhitelist);
  let vApp = addressOrEnsSchema()
    .required()
    .label('appAddress')
    .validateSync(app);

  // ENS resolution if needed
  vApp = await resolveENS(iexec, vApp);

  const userAddress = await iexec.wallet.getAddress();
  const pocoAppRegistryContract = await getPocoAppRegistryContract(iexec);
  const appWhitelistRegistryContract = await getAppWhitelistRegistryContract(
    iexec,
    sharingContractAddress
  );
  const appWhitelistContract = await getAppWhitelistContract(
    iexec,
    vAppWhitelist
  );

  //---------- Smart Contract Call ----------
  await onlyAppWhitelistRegisteredAndManagedByOwner({
    appWhitelistRegistryContract,
    appWhitelist,
    userAddress,
  });
  await onlyAppOwnedBySharingContract({
    sharingContractAddress,
    pocoAppRegistryContract,
    app: vApp,
  });
  await onlyAppNotInAppWhitelist({ appWhitelistContract, app: vApp });

  try {
    const tx = await appWhitelistContract.addApp(vApp);
    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to create AppWhitelist', e);
  }
};
