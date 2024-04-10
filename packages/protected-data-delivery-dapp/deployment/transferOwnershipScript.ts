import {
  DRONE_TARGET_DEPLOY_DEV,
  DRONE_TARGET_DEPLOY_PROD,
  APP_ADDRESS_FILE,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
} from './config/config.js';
import transferOwnership from './singleFunction/transferOwnership.js';
import { getIExec, loadFromFile } from './utils/utils.js';

const main = async () => {
  // get env variables from drone
  const { DRONE_DEPLOY_TO, WALLET_PRIVATE_KEY_DEV, WALLET_PRIVATE_KEY_PROD } =
    process.env;

  if (
    !DRONE_DEPLOY_TO ||
    ![DRONE_TARGET_DEPLOY_DEV, DRONE_TARGET_DEPLOY_PROD].includes(
      DRONE_DEPLOY_TO
    )
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  let privateKey;
  if ([DRONE_TARGET_DEPLOY_DEV].includes(DRONE_DEPLOY_TO)) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  } else if ([DRONE_TARGET_DEPLOY_PROD].includes(DRONE_DEPLOY_TO)) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);
  const appAddress = await loadFromFile(APP_ADDRESS_FILE);

  //revoke sell order for Tee app (scone)
  const txHash = await transferOwnership(
    iexec,
    appAddress,
    DEFAULT_SHARING_CONTRACT_ADDRESS
  );
  if (!txHash)
    throw Error(
      `Failed to transfer ownership of the dapp ${appAddress} to ${DEFAULT_SHARING_CONTRACT_ADDRESS}`
    );
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
