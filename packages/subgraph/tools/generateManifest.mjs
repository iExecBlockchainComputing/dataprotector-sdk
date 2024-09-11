import { readFileSync, writeFileSync } from 'fs';
import { getEnvironment } from '@iexec/dataprotector-environments';

const {
  ENV,
  START_BLOCK,
  APP_REGISTRY_ADDRESS,
  DATASET_REGISTRY_ADDRESS,
  DATAPROTECTOR_ADDRESS,
  DATAPROTECTOR_SHARING_ADDRESS,
  ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS,
} = process.env;

const formatObjForLog = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

console.log(
  `env values:\n${formatObjForLog({
    ENV,
    START_BLOCK,
    APP_REGISTRY_ADDRESS,
    DATASET_REGISTRY_ADDRESS,
    DATAPROTECTOR_ADDRESS,
    DATAPROTECTOR_SHARING_ADDRESS,
    ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS,
  })}\n`
);

const loadFromEnv = (key) => {
  console.log(`loading ${key} from env ${ENV}`);
  return getEnvironment(ENV)[key];
};

const parsedStartBlock = parseInt(START_BLOCK, 10);
const startBlock =
  Number.isNaN(parsedStartBlock) || parsedStartBlock < 0
    ? undefined
    : parsedStartBlock;

const dataprotectorContractAddress =
  DATAPROTECTOR_ADDRESS ?? loadFromEnv('dataprotectorContractAddress');
const dataprotectorStartBlock =
  startBlock ?? loadFromEnv('dataprotectorStartBlock');
const dataprotectorSharingContractAddress =
  DATAPROTECTOR_SHARING_ADDRESS ??
  loadFromEnv('dataprotectorSharingContractAddress');
const dataprotectorSharingStartBlock =
  startBlock ?? loadFromEnv('dataprotectorSharingStartBlock');
const addOnlyAppWhitelistRegistryContractAddress =
  ADD_ONLY_APP_WHITELIST_REGISTRY_ADDRESS ??
  loadFromEnv('addOnlyAppWhitelistRegistryContractAddress');
const addOnlyAppWhitelistRegistryStartBlock =
  startBlock ?? loadFromEnv('addOnlyAppWhitelistRegistryStartBlock');

// use bellecour default values
const appRegistryContractAddress =
  APP_REGISTRY_ADDRESS || '0xB1C52075b276f87b1834919167312221d50c9D16';
const datasetRegistryContractAddress =
  DATASET_REGISTRY_ADDRESS || '0x799DAa22654128d0C64d5b79eac9283008158730';

console.log(
  `\nfinale values:\n${formatObjForLog({
    dataprotectorContractAddress,
    dataprotectorStartBlock,
    dataprotectorSharingContractAddress,
    dataprotectorSharingStartBlock,
    addOnlyAppWhitelistRegistryContractAddress,
    addOnlyAppWhitelistRegistryStartBlock,
    appRegistryContractAddress,
    datasetRegistryContractAddress,
  })}\n`
);

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
  )
  .replaceAll(
    '#APP_REGISTRY_ADDRESS#',
    `address: '${appRegistryContractAddress}'`
  )
  .replaceAll(
    '#DATASET_REGISTRY_ADDRESS#',
    `address: '${datasetRegistryContractAddress}'`
  );

writeFileSync('subgraph.yaml', generated);

console.log('generated subgraph.yaml');
