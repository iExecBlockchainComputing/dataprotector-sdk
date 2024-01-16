import {
  DRONE_TARGET_TRANSFER_OWNERSHIP_DEV,
  DRONE_TARGET_TRANSFER_OWNERSHIP_PROD,
} from './config/config.js';
import transferOwnership from './singleFunction/transferOwnership.js';
import { getIExec } from './utils/utils.js';
import { addressSchema } from './utils/validator.js';

const main = async () => {
  // get env variables from drone
  const {
    DRONE_DEPLOY_TO,
    WALLET_PRIVATE_KEY_DEV,
    WALLET_PRIVATE_KEY_PROD,
    DAPP_ADDRESS,
    NEW_OWNER,
  } = process.env;

  if (
    !DRONE_DEPLOY_TO ||
    ![
      DRONE_TARGET_TRANSFER_OWNERSHIP_DEV,
      DRONE_TARGET_TRANSFER_OWNERSHIP_PROD,
    ].includes(DRONE_DEPLOY_TO)
  )
    throw Error(`Invalid promote target ${DRONE_DEPLOY_TO}`);

  let privateKey;
  if ([DRONE_TARGET_TRANSFER_OWNERSHIP_DEV].includes(DRONE_DEPLOY_TO)) {
    privateKey = WALLET_PRIVATE_KEY_DEV;
  } else if ([DRONE_TARGET_TRANSFER_OWNERSHIP_PROD].includes(DRONE_DEPLOY_TO)) {
    privateKey = WALLET_PRIVATE_KEY_PROD;
  }

  if (!privateKey)
    throw Error(`Failed to get privateKey for target ${DRONE_DEPLOY_TO}`);

  const iexec = getIExec(privateKey);

  // validate params
  const appAddress = await addressSchema().validate(DAPP_ADDRESS);
  const receiverAddress = await addressSchema().validate(NEW_OWNER);

  //revoke sell order for Tee app (scone)
  const txHash = await transferOwnership(iexec, appAddress, receiverAddress);
  if (!txHash)
    throw Error(
      `Failed to transfer ownership of the dapp ${appAddress} to ${receiverAddress}`
    );
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
