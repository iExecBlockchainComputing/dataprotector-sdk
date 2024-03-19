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
  AddAppToAppWhitelistType,
} from '../types/sharingTypes.js';
import { getAppWhitelistContract } from './smartContract/getAppWhitelistContract.js';
import { getAppWhitelistRegistryContract } from './smartContract/getAppWhitelistRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import {
  onlyAppNotInAppWhitelist,
  onlyAppWhitelistRegisteredAndManagedByOwner,
  onlyOwnBySharingContract,
} from './smartContract/preflightChecks.js';

export const addAppToAppWhitelist = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  appWhitelist,
  app,
}: IExecConsumer &
  SharingContractConsumer &
  AddAppToAppWhitelistType): Promise<SuccessWithTransactionHash> => {
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
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
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
  onlyAppNotInAppWhitelist({ appWhitelistContract, app: vApp });
  onlyOwnBySharingContract({ sharingContract, app: vApp });

  try {
    const tx = await appWhitelistContract.addApp(vApp);
    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to create collection into collection smart contract',
      e
    );
  }
};
