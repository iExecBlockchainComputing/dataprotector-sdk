import pkg from 'hardhat';
import { POCO_PROXY_CONTRACT_ADDRESS } from './config/config.js';
import { createAppForContract } from './singleFunction/app.js';
import { consumeProtectedData, setAppAddress } from './singleFunction/contentContract.js';
import { createDatasetForContract } from './singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from './singleFunction/workerpool.js';

const { ethers } = pkg;

async function main() {
  console.log('Starting deployment...');
  const rpcURL = pkg.network.config.url;
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // pass the registry instance to the deploy method
  const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
  const protectedDataSharing = await ProtectedDataSharingFactory.deploy(POCO_PROXY_CONTRACT_ADDRESS);
  const deploymentTransaction = protectedDataSharing.deploymentTransaction();
  await deploymentTransaction?.wait();

  console.log(
    'ProtectedDataSharing contract deployed to address:',
    await protectedDataSharing.getAddress(),
  );
  // deploy fake appContract + workerpoolContract + datasetContract
  const appAddress = await createAppForContract(await protectedDataSharing.getAddress(), rpcURL);
  const contentAddress = await createDatasetForContract(
    await protectedDataSharing.getAddress(),
    rpcURL,
  );
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);

  // create fake workerpoolOrder
  const workerpoolOrder = await createWorkerpoolOrder(iexecWorkerpoolOwner, workerpoolAddress);

  await setAppAddress(protectedDataSharing, appAddress);
  await consumeProtectedData(protectedDataSharing, contentAddress, workerpoolOrder, '');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
