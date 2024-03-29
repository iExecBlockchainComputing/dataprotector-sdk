import { IExec } from 'iexec';
import * as APP_WHITELIST_ABI from '../../abis/AppWhitelistABI.json';
import * as APP_WHITELIST_REGISTRY_ABI from '../../abis/AppWhitelistRegistryABI.json';
import { AppWhitelistRegistry } from '../registry/AppWhitelistRegistry';
import { AppWhitelist } from '../registry/AppWhitelist';
import { Contract } from 'ethers';

const createAppWhitelist = async (
  iexec: IExec,
  sharingContractAddress: string,
  deliveryDappAddress: string
): Promise<string> => {
  const { signer } = await iexec.config.resolveContractsClient();

  const whitelistRegistryContract = new Contract(
    sharingContractAddress,
    JSON.stringify([APP_WHITELIST_REGISTRY_ABI])
  ).connect(signer) as AppWhitelistRegistry;

  const owner = await signer.getAddress();

  const whitelistContractAddress =
    await whitelistRegistryContract.createAppWhitelist(owner);

  console.log(whitelistContractAddress);

  /*
  const whitelistContract = new Contract(
    whitelistContractAddress,
    JSON.stringify([APP_WHITELIST_ABI])
  ).connect(signer) as AppWhitelist;

  const { txOptions } = await iexec.config.resolveContractsClient();
  const tx = await whitelistContract.addApp(deliveryDappAddress, txOptions);
  await tx.wait();
  console.log(`Added dapp to whitelist on tx ${tx.hash}`);
  return tx.hash;*/
  return '';
};

export default createAppWhitelist;
