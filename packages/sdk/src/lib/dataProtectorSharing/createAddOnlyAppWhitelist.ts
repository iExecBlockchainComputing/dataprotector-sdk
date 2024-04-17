import { toBeHex } from 'ethers';
import { WorkflowError } from '../../utils/errors.js';
import { getEventFromLogs } from '../../utils/transactionEvent.js';
import { throwIfMissing } from '../../utils/validators.js';
import { IExecConsumer } from '../types/internalTypes.js';
import {
  CreateAppWhitelistResponse,
  SharingContractConsumer,
} from '../types/sharingTypes.js';
import { getAppWhitelistRegistryContract } from './smartContract/getAddOnlyAppWhitelistRegistryContract.js';

export const createAddOnlyAppWhitelist = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer): Promise<CreateAppWhitelistResponse> => {
  const appWhitelistRegistryContract = await getAppWhitelistRegistryContract(
    iexec,
    sharingContractAddress
  );
  try {
    let userAddress = await iexec.wallet.getAddress();
    userAddress = userAddress.toLowerCase();

    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await appWhitelistRegistryContract.createAddOnlyAppWhitelist(
      userAddress,
      txOptions
    );
    const transactionReceipt = await tx.wait();

    const specificEventForPreviousTx = getEventFromLogs(
      'Transfer',
      transactionReceipt.logs,
      { strict: true }
    );

    const mintedTokenId = toBeHex(specificEventForPreviousTx.args?.tokenId);
    return {
      addOnlyAppWhitelist: mintedTokenId,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to create collection into collection smart contract',
      e
    );
  }
};
