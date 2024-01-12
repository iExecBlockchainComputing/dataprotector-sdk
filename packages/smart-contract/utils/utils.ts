import fs from 'fs/promises';

// if you change the name of the file, you need to change the name in the pipeline too
const SMART_CONTRACT_ADDRESS_FILE = '.smart-contract-address';

/**
 * save the app address in `.smart-contract-address` file for next usages
 */
export const saveSmartContractAddress = (address: string) =>
  fs.writeFile(SMART_CONTRACT_ADDRESS_FILE, address);

// if you change the name of the file, you need to change the name in the pipeline too
const CONSTRUCTOR_ARGS_PARAMS_FILE = '.constructor-args-params';

/**
 * save the app address in `.constructor-arg-params` file for next usages
 */
export const saveConstructorArgsParams = (address: string) =>
  fs.writeFile(CONSTRUCTOR_ARGS_PARAMS_FILE, address);
