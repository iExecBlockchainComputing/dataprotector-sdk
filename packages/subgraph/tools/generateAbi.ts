import { $, fs } from 'zx';
import path from 'path';

$.verbose = false; // Enable verbose output to see the commands being executed.

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

  const processedDirs = new Set();

  for (const contract of contracts) {
    console.log(`Generating ${path.basename(contract.dest)}`);

    const pathSegments = contract.source.split('/');
    // Assume the root directory is always the first two segments (e.g., '../sharing-smart-contract')
    const contractRootDir = pathSegments.slice(0, 2).join('/');

    // Check if this directory has already been processed
    if (!processedDirs.has(contractRootDir)) {
      await $`cd ${contractRootDir} && npm ci && npm run compile`;
      // Mark this directory as processed
      processedDirs.add(contractRootDir);
    }

    const abiContent = JSON.parse(await fs.readFile(contract.source, 'utf8'));
    const abi = `${JSON.stringify(
      abiContent.abi,
      null,
      2
    )}`;

    await fs.writeFile(contract.dest, abi);
  }

  await $`npm run format`;
}

generateABIs();
