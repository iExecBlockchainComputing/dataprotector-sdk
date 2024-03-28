import { Contract } from 'ethers';
import {
  DRONE_TARGET_APP_WHITELIST_DEPLOY_DEV,
  DRONE_TARGET_APP_WHITELIST_DEPLOY_PROD,
} from './config/config';

const main = async () => {
  // get env variables from drone
  const { DRONE_DEPLOY_TO, WALLET_PRIVATE_KEY_DEV, WALLET_PRIVATE_KEY_PROD } =
    process.env;

  if (
    !DRONE_DEPLOY_TO ||
    (DRONE_DEPLOY_TO !== DRONE_TARGET_APP_WHITELIST_DEPLOY_DEV &&
      DRONE_DEPLOY_TO !== DRONE_TARGET_APP_WHITELIST_DEPLOY_PROD)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  let privateKey;
  if (DRONE_DEPLOY_TO === DRONE_TARGET_APP_WHITELIST_DEPLOY_DEV) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  }
  if (DRONE_DEPLOY_TO === DRONE_TARGET_APP_WHITELIST_DEPLOY_PROD) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const { signer } = await iexec.config.resolveContractsClient();
  new Contract(appWhitelist, ABI).connect(signer) as BaseContract; // TODO
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
