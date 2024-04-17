import fs from 'fs/promises';

// if you change the name of the file, you need to change the name in the pipeline too
const SMART_CONTRACT_ADDRESS_FILE_SUFFIX = '.smart-contract-address';
// if you change the name of the file, you need to change the name in the pipeline too
const CONSTRUCTOR_ARGS_PARAMS_FILE_SUFFIX = '.constructor-args-params';
const APP_WHITELIST_REGISTRY = 'AppWhitelistRegistry';
const DATA_PROTECTOR_SHARING = 'DataProtectorSharing';

/**
 * save the app address in `ContractName.smart-contract-address` file for next usages
 */
const saveSmartContractAddress = (contractName) => (address) =>
  fs.writeFile(`${contractName}${SMART_CONTRACT_ADDRESS_FILE_SUFFIX}`, address);

export const saveDataProtectorSharingContractAddress =
  saveSmartContractAddress(DATA_PROTECTOR_SHARING);
export const saveAppWhitelistRegistryContractAddress =
  saveSmartContractAddress(APP_WHITELIST_REGISTRY);

/**
 * save the app address in `ContractName.constructor-arg-params` file for next usages
 */
const saveConstructorArgsParams = (contractName) => (args) =>
  fs.writeFile(`${contractName}${CONSTRUCTOR_ARGS_PARAMS_FILE_SUFFIX}`, args);

export const saveDataProtectorSharingConstructorArgsParams =
  saveConstructorArgsParams(DATA_PROTECTOR_SHARING);
export const saveAppWhitelistRegistryConstructorArgsParams =
  saveConstructorArgsParams(APP_WHITELIST_REGISTRY);
