import { Address, IExec } from 'iexec';

const transferOwnership = async (
  iexec: IExec,
  appAddress: Address,
  receiverAddress: Address
): Promise<string> => {
  try {
    const { txHash } = await iexec.app.transferApp(appAddress, receiverAddress);
    console.log(
      `app ${appAddress} ownership transferred to ${receiverAddress} in tx ${txHash}`
    );
    return txHash;
  } catch (error) {
    throw Error(`Failed to transfer app ownership: ${error.message}`);
  }
};

export default transferOwnership;
