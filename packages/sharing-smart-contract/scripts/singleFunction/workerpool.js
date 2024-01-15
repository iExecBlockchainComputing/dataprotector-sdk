import { Wallet } from 'ethers';
import { IExec, utils } from 'iexec';

const createWorkerpool = async (rpc) => {
  const workerpoolOwnerWallet = Wallet.createRandom();
  const iexecWorkerpoolOwner = new IExec({
    ethProvider: utils.getSignerFromPrivateKey(
      rpc,
      workerpoolOwnerWallet.privateKey
    ),
  });
  const { address: workerpoolAddress } =
    await iexecWorkerpoolOwner.workerpool.deployWorkerpool({
      owner: workerpoolOwnerWallet.address,
      description: 'Test workerpool',
    });
  return { iexecWorkerpoolOwner, workerpoolAddress };
};

const createWorkerpoolOrder = async (
  iexecWorkerpoolOwner,
  workerpoolAddress
) => {
  const workerpoolorder = await iexecWorkerpoolOwner.order
    .createWorkerpoolorder({
      workerpool: workerpoolAddress,
      category: 0,
      tag: ['tee', 'scone'],
      volume: 100,
    })
    .then((order) => iexecWorkerpoolOwner.order.signWorkerpoolorder(order));

  return workerpoolorder;
};

export { createWorkerpool, createWorkerpoolOrder };
