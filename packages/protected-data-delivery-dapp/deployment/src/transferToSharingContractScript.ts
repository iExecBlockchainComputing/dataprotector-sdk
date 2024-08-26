import { KnownEnv, getEnvironment } from '@iexec/dataprotector-environments';
import transferOwnership from './singleFunction/transferOwnership.js';
import { getIExec } from './utils/utils.js';
import 'dotenv/config';

const main = async () => {
  const {
    ENV,
    WALLET_PRIVATE_KEY,
    APP_ADDRESS, // env value override
    DATAPROTECTOR_SHARING_ADDRESS, // env value override
  } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`missing privateKey in WALLET_PRIVATE_KEY`);

  const iexec = getIExec(WALLET_PRIVATE_KEY);

  const appAddress =
    APP_ADDRESS ||
    getEnvironment(ENV as KnownEnv).protectedDataDeliveryDappAddress;

  const sharingContract =
    DATAPROTECTOR_SHARING_ADDRESS ||
    getEnvironment(ENV as KnownEnv).dataprotectorSharingContractAddress;

  const txHash = await transferOwnership(iexec, appAddress, sharingContract);
  if (!txHash)
    throw Error(
      `Failed to transfer ownership of the dapp ${appAddress} to ${sharingContract}`
    );
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
