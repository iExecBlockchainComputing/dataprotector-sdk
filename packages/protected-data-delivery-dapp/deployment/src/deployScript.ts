import {
  APP_ADDRESS_FILE,
  DOCKER_IMAGE_DEV_TAG,
  DOCKER_IMAGE_PROD_TAG,
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  SCONIFIER_VERSION,
} from '../config/config.js';
import deployApp from './singleFunction/deployApp.js';
import { getIExec, saveToFile } from './utils/utils.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    DOCKER_IMAGE_TAG,
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
  } else if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  let dockerImageTag;
  if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_DEV) {
    if (!DOCKER_IMAGE_TAG) {
      dockerImageTag = DOCKER_IMAGE_DEV_TAG;
    } else {
      dockerImageTag = `${DOCKER_IMAGE_TAG}-sconify-${SCONIFIER_VERSION}-production`;
    }
  } else if (DRONE_DEPLOY_TO === DRONE_TARGET_DEPLOY_PROD) {
    dockerImageTag = DOCKER_IMAGE_PROD_TAG;
  }

  //deploy app
  const address = await deployApp({
    iexec,
    dockerTag: dockerImageTag,
  });
  await saveToFile(APP_ADDRESS_FILE, address);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
