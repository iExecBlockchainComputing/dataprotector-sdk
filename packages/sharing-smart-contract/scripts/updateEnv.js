/* eslint-disable no-console */
import pkg from 'hardhat';
import { getLoadFromEnv } from './singleFunction/utils.js';

const { ethers } = pkg;

async function main() {
  const { ENV } = process.env;
  const loadFromEnv = getLoadFromEnv(ENV);

  const {
    DATAPROTECTOR_SHARING_ADDRESS = loadFromEnv('dataprotectorSharingContractAddress'),
    RESULT_PROXY_URL = loadFromEnv('resultProxyUrl'),
  } = process.env;

  const newEnv = ['ipfs', RESULT_PROXY_URL];

  console.log(`UpdateEnv Contract at ${DATAPROTECTOR_SHARING_ADDRESS} with [${newEnv}]`);
  const [admin] = await ethers.getSigners();
  console.log(`using wallet ${admin.address}`);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'DataProtectorSharing',
    DATAPROTECTOR_SHARING_ADDRESS,
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
