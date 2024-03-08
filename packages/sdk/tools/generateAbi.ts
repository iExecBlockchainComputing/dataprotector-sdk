import { $ } from 'zx';

$.verbose = false; // Enable verbose output to see the commands being executed.

// ProtectedDataSharing Path
const PROTECTED_DATA_SHARING_SOURCE_PATH =
  '../sharing-smart-contract/artifacts/contracts/ProtectedDataSharing.sol/ProtectedDataSharing.json';
const PROTECTED_DATA_SHARING_DEST_PATH =
  './src/contracts/ProtectedDataSharingABI.ts';

// Poco Registry Path
const POCO_REGISTRY_SOURCE_PATH =
  '../sharing-smart-contract/artifacts/contracts/interfaces/IRegistry.sol/IRegistry.json';
const POCO_REGISTRY_DEST_PATH = './src/contracts/PocoRegistryABI.ts';

// POCO Registry Path
const DATA_PROTECTOR_SOURCE_PATH =
  '../smart-contract/artifacts/contracts/DataProtector.sol/DataProtector.json';
const DATA_PROTECTOR_DEST_PATH = './src/contracts/DataProtectorABI.ts';

async function generateABIs() {
  console.log('Generating ProtectedDataSharing Abi');
  await $`cd ../sharing-smart-contract && npm ci && npm run compile`;
  await $`jq '.abi' ${PROTECTED_DATA_SHARING_SOURCE_PATH} | tee >(echo "export const ABI = " $(cat) ";" > ${PROTECTED_DATA_SHARING_DEST_PATH})`;

  console.log('Generating Poco Registry Abi');
  await $`jq '.abi' ${POCO_REGISTRY_SOURCE_PATH} | tee >(echo "export const ABI = " $(cat) ";" > ${POCO_REGISTRY_DEST_PATH})`;

  console.log('Generating DataProtector Abi');
  await $`cd ../smart-contract && npm ci && npm run compile`;
  await $`jq '.abi' ${DATA_PROTECTOR_SOURCE_PATH} | tee >(echo "export const ABI = " $(cat) ";" > ${DATA_PROTECTOR_DEST_PATH})`;

  await $`npm run format`;
}

generateABIs();
