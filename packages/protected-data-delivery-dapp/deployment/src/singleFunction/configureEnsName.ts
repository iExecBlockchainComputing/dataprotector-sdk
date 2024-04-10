import { ENS, IExec } from 'iexec';
import {
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  IEXEC_ENS_DOMAINE,
  SUBDOMAIN_DEV,
  SUBDOMAIN_PROD,
} from '../../config/config.js';

const { DRONE_DEPLOY_TO } = process.env;

const configureEnsName = async (
  iexec: IExec,
  appAddress: string,
  ens: ENS
): Promise<void> => {
  try {
    const ensName = await iexec.ens.lookupAddress(appAddress);

    if (ensName) {
      console.log(
        `ENS name already configured for address ${appAddress}: ${ensName}`
      );
      return;
    }
    let subdomain;
    if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV) {
      subdomain = SUBDOMAIN_DEV;
    } else if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD) {
      subdomain = SUBDOMAIN_PROD;
    } else {
      console.error('Invalid deployment target');
      return;
    }
    const claimName = await iexec.ens.claimName(subdomain, IEXEC_ENS_DOMAINE);
    console.log(
      `Claimed and registered ENS name '${claimName.registeredName}' on transaction ${claimName.registerTxHash}`
    );
    console.log(`Configuring ENS ${ens} for app ${appAddress}`);
    const result = await iexec.ens.configureResolution(ens, appAddress);
    console.log(`ENS configured:\n${JSON.stringify(result, undefined, 2)}`);
  } catch (error) {
    console.error(`Error configuring ENS name: ${error.message}`);
  }
};

export default configureEnsName;
