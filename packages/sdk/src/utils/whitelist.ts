import { id } from 'ethers';
import { IExec } from 'iexec';
import {
  ADD_RESOURCE_SELECTOR,
  KEY_PURPOSE_SELECTOR,
} from '../config/config.js';
/**
 * Checks if a contract at the given address contains specific function selectors in its bytecode.
 *
 * @param iexec - The IExec instance.
 * @param appAddressOrWhitelist - The address of the contract to check.
 * @returns True if the contract contains the required function selectors; false otherwise.
 */
export const isDeployedWhitelist = async (
  iexec: IExec,
  whitelistAddress: string
): Promise<boolean> => {
  const contractClient = await iexec.config.resolveContractsClient();
  // Fetch the contract's bytecode
  const contractBytecode = await contractClient.provider.getCode(
    whitelistAddress
  );
  // Check if both function selectors are present in the bytecode
  const hasAddResourceSelector = contractBytecode.includes(
    id(ADD_RESOURCE_SELECTOR).substring(2, 10)
  );
  const hasKeyPurposeSelector = contractBytecode.includes(
    id(KEY_PURPOSE_SELECTOR).substring(2, 10)
  );
  return hasAddResourceSelector && hasKeyPurposeSelector;
};
