import { ethers } from 'hardhat';
import { registryAddress } from '../config/config';
import { saveDeployment } from '../utils/utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // pass the registry instance to the deploy method
  const DataProtector = await ethers.getContractFactory('DataProtector');
  const dataProtector = await DataProtector.deploy(registryAddress);
  await dataProtector.deployed();

  await saveDeployment('DataProtector')({
    address: dataProtector.address,
    args: registryAddress,
    block: dataProtector.deployTransaction.blockNumber!,
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
