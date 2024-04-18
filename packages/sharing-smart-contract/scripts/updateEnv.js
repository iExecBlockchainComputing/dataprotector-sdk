/* eslint-disable no-console */
import pkg from 'hardhat';
// eslint-disable-next-line import/no-extraneous-dependencies
import { getEnvironment } from 'environments';

const { ethers } = pkg;

async function main() {
  const { ENV } = process.env;
  console.log(`using ENV: ${ENV}`);
  const { DataProtectorSharingContractAddress, resultProxyUrl } = getEnvironment(ENV);

  const newEnv = ['ipfs', resultProxyUrl];

  console.log(`UpdateEnv Contract at ${DataProtectorSharingContractAddress} with [${newEnv}]`);
  const [admin] = await ethers.getSigners();
  console.log(`using wallet ${admin.address}`);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'DataProtectorSharing',
    DataProtectorSharingContractAddress,
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
