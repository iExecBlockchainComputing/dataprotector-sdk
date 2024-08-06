import { KnownEnv, getEnvironment } from '@iexec/dataprotector-environments';
import addAppToWhitelist from './singleFunction/addAppToWhitelist.js';
import { getIExec } from './utils/utils.js';
import 'dotenv/config';

const main = async () => {
  const {
    WALLET_PRIVATE_KEY, // whitelist operator
    ENV,
    APP_ADDRESS, // env value override
    WHITELIST_ADDRESS, // env value override
  } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`missing privateKey in WALLET_PRIVATE_KEY`);

  const appAddress =
    APP_ADDRESS ||
    getEnvironment(ENV as KnownEnv).protectedDataDeliveryDappAddress;

  const whitelistAddress =
    WHITELIST_ADDRESS ||
    getEnvironment(ENV as KnownEnv).protectedDataDeliveryWhitelistAddress;

  const iexec = getIExec(WALLET_PRIVATE_KEY);

  console.log(
    `adding address ${appAddress} to AddOnlyAppWhitelist ${whitelistAddress}`
  );

  await addAppToWhitelist(iexec, whitelistAddress, appAddress);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
