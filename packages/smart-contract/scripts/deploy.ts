import { ethers } from 'hardhat';
import { DATASET_REGISTRY_ADDRESS as defaultDatasetRegistryAddress } from '../config/config';
import { saveDeployment } from '../utils/utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  const { DATASET_REGISTRY_ADDRESS = defaultDatasetRegistryAddress } =
    process.env;

  console.log(`Using dataset registry at ${DATASET_REGISTRY_ADDRESS}`);

  // pass the registry instance to the deploy method
  const DataProtector = await ethers.getContractFactory('DataProtector');
  const dataProtector = await DataProtector.deploy(DATASET_REGISTRY_ADDRESS);
  await dataProtector.deployed();

  const deployTxReceipt = await dataProtector.deployTransaction.wait();

  await saveDeployment('DataProtector')({
    address: dataProtector.address,
    args: DATASET_REGISTRY_ADDRESS,
    block: deployTxReceipt.blockNumber,
  });

  console.log(
    'DataProtector contract deployed to address:',
    dataProtector.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
