import { ethers } from 'hardhat';
import { DATASET_REGISTRY_ADDRESS as defaultDatasetRegistryAddress } from '../config/config';
import { env } from '../config/env';
import { saveDeployment } from '../utils/utils';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account:', deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Account balance:', balance.toString());

    const DATASET_REGISTRY_ADDRESS = env.DATASET_REGISTRY_ADDRESS || defaultDatasetRegistryAddress;
    console.log(`Using dataset registry at ${DATASET_REGISTRY_ADDRESS}`);

    // pass the registry instance to the deploy method
    const DataProtector = await ethers.getContractFactory('DataProtector');
    const dataProtector = await DataProtector.deploy(DATASET_REGISTRY_ADDRESS);

    const deploymentTx = dataProtector.deploymentTransaction();
    if (!deploymentTx) {
        throw new Error(
            'Deployment transaction is null. This could indicate an issue with the deployment process.',
        );
    }

    const deployTxReceipt = await deploymentTx.wait();

    await saveDeployment('DataProtector')({
        address: await dataProtector.getAddress(),
        args: DATASET_REGISTRY_ADDRESS,
        block: deployTxReceipt!.blockNumber,
    });

    console.log('DataProtector contract deployed to address:', await dataProtector.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
