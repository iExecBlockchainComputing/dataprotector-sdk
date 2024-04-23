import { readFileSync, writeFileSync } from 'fs';
import { getEnvironment } from '@iexec/dataprotector-environments';

const { ENV, START_BLOCK } = process.env;

console.log(`generating manifest for environment ${ENV}`);

let {
  DataProtectorContractAddress,
  DataProtectorStartBlock,
  DataProtectorSharingContractAddress,
  DataProtectorSharingStartBlock,
  AddOnlyAppWhitelistRegistryContractAddress,
  AddOnlyAppWhitelistRegistryStartBlock,
} = getEnvironment(ENV);

const startBlock = parseInt(START_BLOCK, 10);
if (Number.isNaN(startBlock) || startBlock < 0) {
  console.log('no START_BLOCK, using environment start blocks');
} else {
  DataProtectorStartBlock = startBlock;
  DataProtectorSharingStartBlock = startBlock;
  AddOnlyAppWhitelistRegistryStartBlock = startBlock;
}

console.log({
  DataProtectorContractAddress,
  DataProtectorStartBlock,
  DataProtectorSharingContractAddress,
  DataProtectorSharingStartBlock,
  AddOnlyAppWhitelistRegistryContractAddress,
  AddOnlyAppWhitelistRegistryStartBlock,
});

const template = readFileSync('subgraph.template.yaml').toString();

const generated = template
  .replaceAll(
    '#DATA_PROTECTOR_ADDRESS#',
    `address: '${DataProtectorContractAddress}'`
  )
  .replaceAll(
    '#DATA_PROTECTOR_START_BLOCK#',
    `startBlock: ${DataProtectorStartBlock}`
  )
  .replaceAll(
    '#DATA_PROTECTOR_SHARING_ADDRESS#',
    `address: '${DataProtectorSharingContractAddress}'`
  )
  .replaceAll(
    '#DATA_PROTECTOR_SHARING_START_BLOCK#',
    `startBlock: ${DataProtectorSharingStartBlock}`
  )
  .replaceAll(
    '#ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS#',
    `address: '${AddOnlyAppWhitelistRegistryContractAddress}'`
  )
  .replaceAll(
    '#ADD_ONLY_APP_WHITELIST_REGISTRY_START_BLOCK#',
    `startBlock: ${AddOnlyAppWhitelistRegistryStartBlock}`
  );

writeFileSync('subgraph.yaml', generated);

console.log('generated subgraph.yaml');
