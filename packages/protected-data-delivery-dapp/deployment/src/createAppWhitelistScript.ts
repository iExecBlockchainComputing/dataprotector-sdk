import {
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
  APP_WHITELIST_ADDRESS_FILE,
} from '../config/config.js';
import createAppWhitelist from './singleFunction/createAppWhitelist.js';
import { getIExec, saveToFile } from './utils/utils.js';

const main = async () => {
  // get env variables from drone
  const { DRONE_DEPLOY_TO, WALLET_PRIVATE_KEY_DEV, WALLET_PRIVATE_KEY_PROD } =
    process.env;

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

  const iexec = getIExec(privateKey);

  const appWhitelistAddress = await createAppWhitelist(
    iexec,
    DEFAULT_SHARING_CONTRACT_ADDRESS
  );

  await saveToFile(APP_WHITELIST_ADDRESS_FILE, appWhitelistAddress);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
