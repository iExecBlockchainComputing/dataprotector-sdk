import { Contract, toBeHex } from 'ethers';
import { IExec } from 'iexec';
import * as ADD_ONLY_APP_WHITELIST_REGISTRY_ABI from '../../abis/AddOnlyAppWhitelistRegistryABI.json';
import * as DATA_SHARING_ABI from '../../abis/DataProtectorSharingABI.json';
import { getEventFromLogs } from '../utils/transactionEvent.js';

const createAddOnlyAppWhitelist = async (
  iexec: IExec,
  sharingContractAddress: string
): Promise<string> => {
  try {
    const { signer } = await iexec.config.resolveContractsClient();
    const owner = await signer.getAddress();
    const { txOptions } = await iexec.config.resolveContractsClient();

    const protectedDataSharingContract = new Contract(
      sharingContractAddress,
      DATA_SHARING_ABI.default,
      signer
    );

    const addOnlyAppWhitelistRegistryAddress =
      await protectedDataSharingContract.ADD_ONLY_APP_WHITELIST_REGISTRY();

    const addOnlyAppWhitelistRegistryContract = new Contract(
      addOnlyAppWhitelistRegistryAddress,
      ADD_ONLY_APP_WHITELIST_REGISTRY_ABI.default,
      signer
    );

    const createWhitelistTx =
      await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(
        owner,
        txOptions
      );
    const createWhitelistReceipt = await createWhitelistTx.wait();
    const specificEventForPreviousTx = getEventFromLogs(
      'Transfer',
      createWhitelistReceipt.logs,
      { strict: true }
    );

    const addOnlyAppWhitelistAddress = toBeHex(
      specificEventForPreviousTx.args?.tokenId
    );

    console.log(
      `Created AddOnlyAppWhitelist ${addOnlyAppWhitelistAddress} (tx: ${createWhitelistReceipt.hash})`
    );
    return addOnlyAppWhitelistAddress;
  } catch (error) {
    throw Error(`Error creating app whitelist: ${error.message}`);
  }
};

export default createAddOnlyAppWhitelist;
