import { id } from 'ethers';
import { IExec } from 'iexec';
import { KEY_PURPOSE_SELECTOR } from '../config/config.js';
import { getWhitelistContract as getWhitelistContractFn } from '../lib/dataProtectorCore/smartContract/getWhitelistContract.js';
import { isAddressInWhitelist as isAddressInWhitelistFn } from '../lib/dataProtectorCore/smartContract/whitelistContract.read.js';

export type WhitelistUtils = {
  whitelistUtils: {
    isERC734: typeof isERC734;
    getWhitelistContract: typeof getWhitelistContractFn;
    isAddressInWhitelist: typeof isAddressInWhitelistFn;
  };
};

/**
 * Checks if a contract at the given address contains specific function selectors in its bytecode.
 *
 * @param iexec - The IExec instance.
 * @param whitelistAddress - The address of the contract to check.
 * @returns True if the contract contains the required function selectors; false otherwise.
 */
async function isERC734(
  iexec: IExec,
  whitelistAddress: string
): Promise<boolean> {
  const contractClient = await iexec.config.resolveContractsClient();
  // Fetch the contract's bytecode
  const contractBytecode = await contractClient.provider.getCode(
    whitelistAddress
  );
  return contractBytecode.includes(id(KEY_PURPOSE_SELECTOR).substring(2, 10));
}

export function getWhitelistUtils() {
  return {
    isERC734,
    getWhitelistContract: getWhitelistContractFn,
    isAddressInWhitelist: isAddressInWhitelistFn,
  };
}
