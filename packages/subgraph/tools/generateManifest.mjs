import { readFileSync, writeFileSync } from 'fs';
import { getEnvironment } from '@iexec/dataprotector-environments';

const { ENV, START_BLOCK } = process.env;

console.log(`generating manifest for environment ${ENV}`);

let {
  dataprotectorContractAddress,
  dataprotectorStartBlock,
  dataprotectorSharingContractAddress,
  dataprotectorSharingStartBlock,
  addOnlyAppWhitelistRegistryContractAddress,
  addOnlyAppWhitelistRegistryStartBlock,
} = getEnvironment(ENV);

const startBlock = parseInt(START_BLOCK, 10);
if (Number.isNaN(startBlock) || startBlock < 0) {
  console.log('no START_BLOCK, using environment start blocks');
} else {
  dataprotectorStartBlock = startBlock;
  dataprotectorSharingStartBlock = startBlock;
  addOnlyAppWhitelistRegistryStartBlock = startBlock;
}

console.log({
  dataprotectorContractAddress,
  dataprotectorStartBlock,
  dataprotectorSharingContractAddress,
  dataprotectorSharingStartBlock,
  addOnlyAppWhitelistRegistryContractAddress,
  addOnlyAppWhitelistRegistryStartBlock,
});

const template = readFileSync('subgraph.template.yaml').toString();

const generated = template
  .replaceAll(
    '#DATA_PROTECTOR_ADDRESS#',
    `address: '${dataprotectorContractAddress}'`
  )
  .replaceAll(
    '#DATA_PROTECTOR_START_BLOCK#',
    `startBlock: ${dataprotectorStartBlock}`
  )
  .replaceAll(
    '#DATA_PROTECTOR_SHARING_ADDRESS#',
    `address: '${dataprotectorSharingContractAddress}'`
  )
  .replaceAll(
    '#DATA_PROTECTOR_SHARING_START_BLOCK#',
    `startBlock: ${dataprotectorSharingStartBlock}`
  )
  .replaceAll(
    '#ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS#',
    `address: '${addOnlyAppWhitelistRegistryContractAddress}'`
  )
  .replaceAll(
    '#ADD_ONLY_APP_WHITELIST_REGISTRY_START_BLOCK#',
    `startBlock: ${addOnlyAppWhitelistRegistryStartBlock}`
  );

writeFileSync('subgraph.yaml', generated);

console.log('generated subgraph.yaml');
