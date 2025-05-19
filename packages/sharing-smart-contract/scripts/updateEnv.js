/* eslint-disable no-console */
import { getEnvironment } from '@iexec/dataprotector-environments';
import pkg from 'hardhat';
import { env } from '../config/env.js';
const { ethers } = pkg;

async function main() {
    const { ENV } = env;
    console.log(`using ENV: ${ENV}`);
    const { dataprotectorSharingContractAddress } = getEnvironment(ENV);

    const newResultStorageProvider = 'ipfs';

    console.log(
        `UpdateEnv contract at ${dataprotectorSharingContractAddress} ` +
            `[newResultStorageProvider=${newResultStorageProvider}]`,
    );
    const [admin] = await ethers.getSigners();
    console.log(`using wallet ${admin.address}`);

    const dataProtectorSharingContract = await ethers.getContractAt(
        'DataProtectorSharing',
        dataprotectorSharingContractAddress,
    );

    const updateEnvTx = await dataProtectorSharingContract.updateEnv(newResultStorageProvider);
    console.log(`tx: ${updateEnvTx.hash}`);

    await updateEnvTx.wait();
    console.log('updateEnv confirmed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
