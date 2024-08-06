import { KnownEnv, getEnvironment } from '@iexec/dataprotector-environments';
import configureEnsName from './singleFunction/configureEnsName.js';
import { getIExec } from './utils/utils.js';
import 'dotenv/config';

const main = async () => {
  const {
    WALLET_PRIVATE_KEY, // app owner
    ENV,
    APP_ADDRESS, // env value override
    APP_ENS, // env value override
  } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`missing privateKey in WALLET_PRIVATE_KEY`);

  const appAddress =
    APP_ADDRESS ||
    getEnvironment(ENV as KnownEnv).protectedDataDeliveryDappAddress;

  const ensName =
    APP_ENS || getEnvironment(ENV as KnownEnv).protectedDataDeliveryDappEns;

  const iexec = getIExec(WALLET_PRIVATE_KEY);

  console.log(`configuring ENS ${ensName} for address ${appAddress}`);

  await configureEnsName(iexec, appAddress, ensName);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
