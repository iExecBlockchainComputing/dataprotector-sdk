import { Address, IExec } from 'iexec';

const transferOwnership = async (
  iexec: IExec,
  appAddress: Address,
  receiverAddress: Address
): Promise<string> => {
  const { address, txHash } = await iexec.app.transferApp(
    appAddress,
    receiverAddress
  );
  console.log(
    `app ${address} ownership transferred to ${address} in tx ${txHash}`
  );
  return txHash;
};

export default transferOwnership;
