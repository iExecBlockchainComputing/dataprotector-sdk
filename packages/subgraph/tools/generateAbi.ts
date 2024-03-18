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

  for (const contract of contracts) {
    console.log(`Generating ${path.basename(contract.dest)}`);

    // Compile contracts if necessary. Assumes compilation has same command for both contracts.
    // Adjust or move within loop if different commands are needed.
    const contractDir = path.dirname(contract.source);
    await $`cd ${contractDir} && npm ci && npm run compile`;

    // Read the compiled contract ABI
    const abiContent = JSON.parse(await fs.readFile(contract.source, 'utf8'));
    const abi = JSON.stringify(abiContent.abi, null, 2);

    // Write the ABI to a new file
    await fs.writeFile(contract.dest, abi);
  }

  // Format the output (ensure this command is correct for your project's setup)
  await $`npm run format`;
}

generateABIs();
