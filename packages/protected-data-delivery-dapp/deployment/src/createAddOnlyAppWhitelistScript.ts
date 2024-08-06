import { KnownEnv, getEnvironment } from '@iexec/dataprotector-environments';
import { APP_WHITELIST_ADDRESS_FILE } from '../config/config.js';
import createAddOnlyAppWhitelist from './singleFunction/createAddOnlyAppWhitelist.js';
import { getIExec, saveToFile } from './utils/utils.js';
import 'dotenv/config';

const main = async () => {
  const {
    WALLET_PRIVATE_KEY, // future whitelist owner
    ENV,
    DATAPROTECTOR_SHARING_ADDRESS, // env value override
  } = process.env;

  if (!WALLET_PRIVATE_KEY)
    throw Error(`missing privateKey in WALLET_PRIVATE_KEY`);

  const iexec = getIExec(WALLET_PRIVATE_KEY);

  const dataprotectorSharing =
    DATAPROTECTOR_SHARING_ADDRESS ||
    getEnvironment(ENV as KnownEnv).dataprotectorSharingContractAddress;

  console.log(
    `creating AddOnlyAppWhitelist for DataprotectorSharing ${dataprotectorSharing}`
  );

  const addOnlyAppWhitelistAddress = await createAddOnlyAppWhitelist(
    iexec,
    dataprotectorSharing
  );

  await saveToFile(APP_WHITELIST_ADDRESS_FILE, addOnlyAppWhitelistAddress);
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
