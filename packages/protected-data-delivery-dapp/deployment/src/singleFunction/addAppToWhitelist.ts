import { Contract } from 'ethers';
import { IExec } from 'iexec';
import * as ADD_ONLY_APP_WHITELIST_ABI from '../../abis/AddOnlyAppWhitelistABI.json';

const addAppToWhitelist = async (
  iexec: IExec,
  addOnlyAppWhitelistContractAddress: string,
  deliveryAppAddress: string
): Promise<string> => {
  try {
    const { signer } = await iexec.config.resolveContractsClient();

    const addOnlyAppWhitelistContract = new Contract(
      addOnlyAppWhitelistContractAddress,
      ADD_ONLY_APP_WHITELIST_ABI.default,
      signer
    );

    const addAppTx = await addOnlyAppWhitelistContract.addApp(deliveryAppAddress);
    const addAppReceipt = await addAppTx.wait();
    console.log(
      `Added App ${deliveryAppAddress} to whitelist ${addOnlyAppWhitelistContractAddress}  (tx: ${addAppReceipt.hash})`
    );
    return addOnlyAppWhitelistContractAddress;
  } catch (error) {
    console.error(`Error adding app to whitelist: ${error.message}`);
  }
};

export default addAppToWhitelist;
