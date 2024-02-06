import { Wallet } from 'ethers';
import { IExec, utils } from 'iexec';

const createDatasetFor = async (owner, rpc) => {
  const datasetOwnerWallet = Wallet.createRandom();
  const iexecDatasetOwner = new IExec({
    ethProvider: utils.getSignerFromPrivateKey(rpc, datasetOwnerWallet.privateKey),
  });

  const { address: datasetAddress } = await iexecDatasetOwner.dataset.deployDataset({
    owner,
    name: `test content${Date.now()}`,
    multiaddr: '/ipfs/Qmd286K6pohQcTKYqnS1YhWrCiS4gz7Xi34sdwMe9USZ7u',
    checksum: '0x84a3f860d54f3f5f65e91df081c8d776e8bcfb5fbc234afce2f0d7e9d26e160d',
  });

  return datasetAddress;
};

export { createDatasetFor };
