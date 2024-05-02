import { IExec } from 'iexec';

const revokeSellOrder = async (
  iexec: IExec,
  orderHash: string
): Promise<string> => {
  try {
    console.log(`Revoking apporder with the orderHash: ${orderHash}`);
    const orderToCancel = await iexec.orderbook.fetchApporder(orderHash);
    const { txHash } = await iexec.order.cancelApporder(orderToCancel.order);
    console.log(`Revoked apporder ${orderHash}\n (tx: ${txHash})`);
    return txHash;
  } catch (error) {
    throw Error(`Failed to cancel apporder ${orderHash}: ${error.message}`);
  }
};

export default revokeSellOrder;
