/* eslint-disable no-console */
import { getEnvironment } from '@iexec/dataprotector-environments';
import pkg from 'hardhat';

const { ethers } = pkg;

async function main() {
  const { ENV } = process.env;
  console.log(`using ENV: ${ENV}`);
  const { dataprotectorSharingContractAddress, resultProxyUrl } = getEnvironment(ENV);

  const newEnv = ['ipfs', resultProxyUrl];

  console.log(`UpdateEnv Contract at ${dataprotectorSharingContractAddress} with [${newEnv}]`);
  const [admin] = await ethers.getSigners();
  console.log(`using wallet ${admin.address}`);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'DataProtectorSharing',
    dataprotectorSharingContractAddress,
  );

  const updateEnvTx = await dataProtectorSharingContract.updateEnv(...newEnv);
  console.log(`tx: ${updateEnvTx.hash}`);

  await updateEnvTx.wait();
  console.log('updateEnv confirmed');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
