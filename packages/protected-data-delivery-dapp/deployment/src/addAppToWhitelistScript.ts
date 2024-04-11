import {
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  APP_WHITELIST_ADDRESS_FILE,
  APP_ADDRESS_FILE,
} from '../config/config.js';
import addAppToWhitelist from './singleFunction/addAppToWhitelist.js';
import { getIExec, loadFromFile } from './utils/utils.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    APP_WHITELIST,
  } = process.env;

  if (
    !DRONE_DEPLOY_TO ||
    (DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_DEV &&
      DRONE_DEPLOY_TO !== DRONE_TARGET_DEPLOY_PROD)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  let privateKey;
  if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  }
  if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  if (!APP_WHITELIST) throw Error(`Failed to get app Whitelist address`);

  const iexec = getIExec(privateKey);

  const appAddress = await loadFromFile(APP_ADDRESS_FILE);
  await addAppToWhitelist(iexec, APP_WHITELIST, appAddress);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
