import { fs } from 'zx';
import path from 'path';

const FOLDER_PATH = './abis';

// Define paths for the source JSON files and destination ABI files
const contracts = [
  {
    source:
      '../sharing-smart-contract/artifacts/contracts/DataProtectorSharing.sol/DataProtectorSharing.json',
    dest: './abis/DataProtectorSharingABI.json',
  },
  {
    source:
      '../sharing-smart-contract/artifacts/contracts/registry/AppWhitelistRegistry.sol/AppWhitelistRegistry.json',
    dest: './abis/AppWhitelistRegistryABI.json',
  },
  {
    source:
      '../sharing-smart-contract/artifacts/contracts/registry/AppWhitelist.sol/AppWhitelist.json',
    dest: './abis/AppWhitelistABI.json',
  },
  {
    source:
      '../smart-contract/artifacts/contracts/DataProtector.sol/DataProtector.json',
    dest: './abis/DataProtectorCoreABI.json',
  },
];

async function generateABIs() {
  // Ensure the destination folder exists
  await fs.mkdir(FOLDER_PATH, { recursive: true });
  for (const contract of contracts) {
    console.log(`Generating ${path.basename(contract.dest)}`);
    const artifact = await fs.readFile(contract.source, 'utf8').catch((e) => {
      throw Error(
        `Cannot read ${contract.dest} did you forget to compile contracts? - ${e}`
      );
    });
    const { abi } = JSON.parse(artifact);
    await fs.writeFile(contract.dest, JSON.stringify(abi, null, 2));
  }
}

generateABIs();
