import { ethers } from 'hardhat';
import { registryAddress } from '../config/config';
import {
  saveConstructorArgsParams,
  saveSmartContractAddress,
} from '../utils/utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);
  console.log('Account balance:', (await deployer.getBalance()).toString());

  // pass the registry instance to the deploy method
  const DataProtector = await ethers.getContractFactory('DataProtector');
  const dataProtector = await DataProtector.deploy(registryAddress);
  await dataProtector.deployed();

  // save the smart contract address in `.smart-contract-address` file for next usages
  await saveSmartContractAddress(dataProtector.address);
  // save the constructor args params in `.constructor-args-params` file for next usages
  await saveConstructorArgsParams(registryAddress);

  console.log(
    'DataProtector contract deployed to address:',
    dataProtector.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
