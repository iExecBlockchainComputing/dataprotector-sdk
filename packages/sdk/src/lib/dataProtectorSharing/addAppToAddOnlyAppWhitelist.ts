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
import { getAppWhitelistContract } from './smartContract/getAddOnlyAppWhitelistContract.js';
import { getAppWhitelistRegistryContract } from './smartContract/getAddOnlyAppWhitelistRegistryContract.js';
import { getPocoAppRegistryContract } from './smartContract/getPocoRegistryContract.js';
import {
  onlyAppNotInAppWhitelist,
  onlyAppOwnedBySharingContract,
  onlyAppWhitelistRegisteredAndManagedByOwner,
} from './smartContract/preflightChecks.js';

export const addAppToAddOnlyAppWhitelist = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  addOnlyAppWhitelist,
  app,
}: IExecConsumer &
  SharingContractConsumer &
  AddAppToAppWhitelistParams): Promise<SuccessWithTransactionHash> => {
  const vAddOnlyAppWhitelist = addressSchema()
    .required()
    .label('addOnlyAppWhitelist')
    .validateSync(addOnlyAppWhitelist);
  let vApp = addressOrEnsSchema()
    .required()
    .label('appAddress')
    .validateSync(app);

  // ENS resolution if needed
  vApp = await resolveENS(iexec, vApp);

  const userAddress = await iexec.wallet.getAddress();
  const pocoAppRegistryContract = await getPocoAppRegistryContract(iexec);
  const addOnlyAppWhitelistRegistryContract =
    await getAppWhitelistRegistryContract(iexec, sharingContractAddress);
  const addOnlyAppWhitelistContract = await getAppWhitelistContract(
    iexec,
    vAddOnlyAppWhitelist
  );

  //---------- Smart Contract Call ----------
  await onlyAppWhitelistRegisteredAndManagedByOwner({
    addOnlyAppWhitelistRegistryContract,
    addOnlyAppWhitelist,
    userAddress,
  });
  await onlyAppOwnedBySharingContract({
    sharingContractAddress,
    pocoAppRegistryContract,
    app: vApp,
  });
  await onlyAppNotInAppWhitelist({ addOnlyAppWhitelistContract, app: vApp });

  try {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await addOnlyAppWhitelistContract.addApp(vApp, txOptions);
    await tx.wait();
    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError({
      message: 'Failed to add an App in the AppWhitelist',
      errorCause: e,
    });
  }
};
