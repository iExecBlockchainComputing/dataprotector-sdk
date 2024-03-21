import path from 'path';
import { $, fs } from 'zx';

const FOLDER_PATH = './src/contracts';

// Define paths for source JSON files and destination ABI files
const contracts = [
  {
    source:
      '../sharing-smart-contract/artifacts/contracts/DataProtectorSharing.sol/DataProtectorSharing.json',
    dest: './src/contracts/DataProtectorSharingABI.ts',
  },
  {
    source:
      '../sharing-smart-contract/artifacts/contracts/registry/AppWhitelistRegistry.sol/AppWhitelistRegistry.json',
    dest: './src/contracts/AppWhitelistRegistryABI.ts',
  },
  {
    source:
      '../sharing-smart-contract/artifacts/contracts/registry/AppWhitelist.sol/AppWhitelist.json',
    dest: './src/contracts/AppWhitelistABI.ts',
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
  await $`npx prettier --write src/contracts`;
}

generateABIs();
