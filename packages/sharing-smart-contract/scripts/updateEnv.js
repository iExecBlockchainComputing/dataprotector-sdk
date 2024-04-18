/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-useless-escape */
import pkg from 'hardhat';

const { ethers } = pkg;

async function main() {
  const { RESULT_STORAGE_PROXY, PROTECTED_DATA_SHARING_CONTRACT } = process.env;

  const urlRegex = /^https:\/\/([a-z0-9.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  if (!urlRegex.test(RESULT_STORAGE_PROXY)) {
    throw Error('The RESULT_STORAGE_PROXY is not a valid HTTPS URL.');
  }
  if (!ethers.isAddress(PROTECTED_DATA_SHARING_CONTRACT)) {
    throw Error('Invalid PROTECTED_DATA_SHARING_CONTRACT address');
  }

  console.log('Starting UpdateEnv in Contract at: ', PROTECTED_DATA_SHARING_CONTRACT);
  const [admin] = await ethers.getSigners();
  console.log('Admin address: ', admin.address);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'DataProtectorSharing',
    PROTECTED_DATA_SHARING_CONTRACT,
  );

  const updateEnvTx = await dataProtectorSharingContract.updateEnv('ipfs', RESULT_STORAGE_PROXY);
  await updateEnvTx.wait();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
