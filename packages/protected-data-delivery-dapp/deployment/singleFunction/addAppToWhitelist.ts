import { Contract } from 'ethers';
import { IExec } from 'iexec';
import * as APP_WHITELIST_ABI from '../abis/AppWhitelistABI.json';

const addAppToWhitelist = async (
  iexec: IExec,
  appWhitelistContractAddress: string,
  deliveryAppAddress: string
): Promise<string> => {
  try {
    const { signer } = await iexec.config.resolveContractsClient();

    const appWhitelistContract = new Contract(
      appWhitelistContractAddress,
      APP_WHITELIST_ABI.default,
      signer
    );

    const addAppTx = await appWhitelistContract.addApp(deliveryAppAddress);
    const addAppReceipt = await addAppTx.wait();
    console.log(
      `Added App ${deliveryAppAddress} to whitelist ${appWhitelistContractAddress}  (tx: ${addAppReceipt.hash})`
    );
    return appWhitelistContractAddress;
  } catch (error) {
    console.error(`Error adding app to whitelist: ${error.message}`);
  }
};

export default addAppToWhitelist;
