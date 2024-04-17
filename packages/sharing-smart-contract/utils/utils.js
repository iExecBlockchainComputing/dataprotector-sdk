import fs from 'fs/promises';

// if you change the name of the file, you need to change the name in the pipeline too
const SMART_CONTRACT_ADDRESS_FILE_SUFFIX = '.smart-contract-address';

/**
 * save the app address in `.smart-contract-address` file for next usages
 */
const saveSmartContractAddress = (contractName) => (address) =>
  fs.writeFile(`${contractName}${SMART_CONTRACT_ADDRESS_FILE_SUFFIX}`, address);

export const saveDataProtectorSharingContractAddress =
  saveSmartContractAddress('DataProtectorSharing');
export const saveAppWhitelistRegistryContractAddress =
  saveSmartContractAddress('AppWhitelistRegistry');

// if you change the name of the file, you need to change the name in the pipeline too
const CONSTRUCTOR_ARGS_PARAMS_FILE_SUFFIX = '.constructor-args-params';

/**
 * save the app address in `.constructor-arg-params` file for next usages
 */
const saveConstructorArgsParams = (contractName) => (args) =>
  fs.writeFile(`${contractName}${CONSTRUCTOR_ARGS_PARAMS_FILE_SUFFIX}`, args);

export const saveDataProtectorSharingConstructorArgsParams =
  saveConstructorArgsParams('DataProtectorSharing');
export const saveAppWhitelistRegistryConstructorArgsParams =
  saveConstructorArgsParams('AppWhitelistRegistry');
