import { mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const TARGET_DIR = './abis';

// Define paths for the source JSON files and destination ABI files.
// DataProtectorSharingABI, AddOnlyAppWhitelistRegistryABI and AddOnlyAppWhitelistABI
// are frozen copies kept in ./abis: their source package (sharing-smart-contract)
// was removed from the monorepo and the deployed contracts no longer change.
const ABIS = [
  {
    source: '../smart-contract/abis/DataProtector.sol/DataProtector.json',
    dest: 'DataProtectorCoreABI.json',
  },
];

mkdirSync(TARGET_DIR, { recursive: true });

// regen abis
ABIS.forEach(({ source, dest }) => {
  copyFileSync(source, join(TARGET_DIR, dest));
  console.log(`refreshed ${dest} from ${source}`);
});
