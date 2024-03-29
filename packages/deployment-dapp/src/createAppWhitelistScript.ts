import { Contract } from 'ethers';
import {
  DRONE_TARGET_APP_WHITELIST_DEPLOY_DEV,
  DRONE_TARGET_APP_WHITELIST_DEPLOY_PROD,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
} from './config/config';
import { getIExec } from './utils/utils';
import createAppWhitelist from './singleFunction/createAppWhitelist.js';
import { addressSchema } from './utils/validator.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    DAPP_ADDRESS,
  } = process.env;

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

  if (!DAPP_ADDRESS)
    throw Error(`Failed to get dappAddress for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  const appAddress = await addressSchema().validate(DAPP_ADDRESS);
  await createAppWhitelist(iexec, DEFAULT_SHARING_CONTRACT_ADDRESS, appAddress);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
