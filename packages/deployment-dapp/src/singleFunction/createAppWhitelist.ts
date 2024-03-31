import { Contract, toBeHex } from 'ethers';
import { IExec } from 'iexec';
import * as APP_WHITELIST_REGISTRY_ABI from '../../abis/AppWhitelistRegistryABI.json';
import * as DATA_SHARING_ABI from '../../abis/DataProtectorSharingABI.json';
import { getEventFromLogs } from '../utils/transactionEvent';

const createAppWhitelist = async (
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

    const appWhitelistRegistryAddress =
      await protectedDataSharingContract.appWhitelistRegistry();

    const appWhitelistRegistryContract = new Contract(
      appWhitelistRegistryAddress,
      APP_WHITELIST_REGISTRY_ABI.default,
      signer
    );

    const createWhitelistTx =
      await appWhitelistRegistryContract.createAppWhitelist(owner, txOptions);
    const createWhitelistReceipt = await createWhitelistTx.wait();
    const specificEventForPreviousTx = getEventFromLogs(
      'Transfer',
      createWhitelistReceipt.logs,
      { strict: true }
    );

    const appWhitelistAddress = toBeHex(
      specificEventForPreviousTx.args?.tokenId
    );

    console.log(
      `Created App Whitelist ${appWhitelistAddress} (tx: ${createWhitelistReceipt.hash})`
    );
    return appWhitelistAddress;
  } catch (error) {
    console.error(`Error creating app whitelist: ${error.message}`);
  }
};

export default createAppWhitelist;
