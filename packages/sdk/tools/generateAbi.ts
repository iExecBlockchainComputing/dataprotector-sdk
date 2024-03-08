/* eslint-disable @typescript-eslint/no-unused-vars */
import { $ } from 'zx';

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

  console.log('Generating ProtectedDataSharing Abi');
  await $`cd ../sharing-smart-contract && npm ci && npm run compile`;
  await $`jq '.abi' ${PROTECTED_DATA_SHARING_SOURCE_PATH} | tee >(echo "export const ABI = " $(cat) ";" > ${PROTECTED_DATA_SHARING_DEST_PATH})`;

  await $`npm run format`;
}

generateABIs();
