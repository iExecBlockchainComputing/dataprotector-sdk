import { rmSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const TARGET_DIR = './abis';

// Define paths for the source JSON files and destination ABI files
const ABIS = [
  {
    source:
      '../sharing-smart-contract/abis/DataProtectorSharing.sol/DataProtectorSharing.json',
    dest: 'DataProtectorSharingABI.json',
  },
  {
    source:
      '../sharing-smart-contract/abis/registry/AppWhitelistRegistry.sol/AppWhitelistRegistry.json',
    dest: 'AppWhitelistRegistryABI.json',
  },
  {
    source:
      '../sharing-smart-contract/abis/registry/AppWhitelist.sol/AppWhitelist.json',
    dest: 'AppWhitelistABI.json',
  },
  {
    source: '../smart-contract/abis/DataProtector.sol/DataProtector.json',
    dest: 'DataProtectorCoreABI.json',
  },
];

// cleaning
rmSync(TARGET_DIR, { recursive: true, force: true });
mkdirSync(TARGET_DIR);

// regen abis
ABIS.forEach(({ source, dest }) => {
  copyFileSync(source, join(TARGET_DIR, dest));
  console.log(`refreshed ${dest} from ${source}`);
});
