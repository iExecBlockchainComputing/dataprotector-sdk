import { Address, IExec } from 'iexec';

const transferOwnership = async (
  iexec: IExec,
  appAddress: Address,
  receiverAddress: Address
): Promise<string> => {
  const { txHash } = await iexec.app.transferApp(appAddress, receiverAddress);
  console.log(
    `app ${appAddress} ownership transferred to ${receiverAddress} in tx ${txHash}`
  );
  return txHash;
};

export default transferOwnership;
