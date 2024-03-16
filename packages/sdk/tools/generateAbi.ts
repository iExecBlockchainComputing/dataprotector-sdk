import path from 'path';
import { $, fs } from 'zx';

$.verbose = false; // Enable verbose output to see the commands being executed.

const FOLDER_PATH = './src/contracts';

// ProtectedDataSharing Path
const PROTECTED_DATA_SHARING_SOURCE_PATH =
  '../sharing-smart-contract/artifacts/contracts/ProtectedDataSharing.sol/ProtectedDataSharing.json';
const PROTECTED_DATA_SHARING_DEST_PATH =
  './src/contracts/ProtectedDataSharingABI.ts';

async function generateABIs() {
  // Check if the destination folder exists, if not, create it
  await $`mkdir -p ${FOLDER_PATH}`;

  console.log('Generating ProtectedDataSharing ABI');
  await $`cd ../sharing-smart-contract && npm ci && npm run compile`;

  // Use Node.js to read the JSON file and extract the ABI
  const abiPath = path.resolve(PROTECTED_DATA_SHARING_SOURCE_PATH);
  const abiContent = JSON.parse(await fs.readFile(abiPath, 'utf8'));
  const abi = abiContent.abi;

  // Write the ABI to the destination file
  const destPath = path.resolve(PROTECTED_DATA_SHARING_DEST_PATH);
  await fs.writeFile(
    destPath,
    `export const ABI = ${JSON.stringify(abi, null, 2)};`
  );

  await $`npm run format`;
}

generateABIs();
