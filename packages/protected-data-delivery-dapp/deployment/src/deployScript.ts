import {
  APP_ADDRESS_FILE,
  DOCKER_IMAGE_TEE_PROD_TAG,
  DOCKER_IMAGE_TEE_STAGING_TAG,
} from '../config/config.js';
import deployApp from './singleFunction/deployApp.js';
import { getIExec, saveToFile } from './utils/utils.js';
import 'dotenv/config';

const main = async () => {
  const {
    WALLET_PRIVATE_KEY, // future app owner
    ENV,
    DOCKER_IMAGE_TAG, // override to deploy from the same sconified docker image
  } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`missing privateKey in WALLET_PRIVATE_KEY`);

  const iexec = getIExec(WALLET_PRIVATE_KEY);

  let dockerImageTag;

  if (DOCKER_IMAGE_TAG) {
    dockerImageTag = DOCKER_IMAGE_TAG;
  } else {
    switch (ENV) {
      case 'staging':
        dockerImageTag = DOCKER_IMAGE_TEE_STAGING_TAG;
        break;
      case 'prod':
        dockerImageTag = DOCKER_IMAGE_TEE_PROD_TAG;
        break;
      default:
        throw Error(
          `Missing DOCKER_IMAGE_TAG and no default value for ENV ${ENV}`
        );
    }
  }

  console.log(`deploying app with docker tag ${dockerImageTag}`);

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
