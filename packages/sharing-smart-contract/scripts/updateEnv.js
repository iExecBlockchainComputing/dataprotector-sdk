/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import pkg from 'hardhat';

const { ethers } = pkg;

const PROTECTED_DATA_SHARING_CONTRACT_ADDRESS = '0xeE60c6E6583D0ECc8087Ce6f1Edc7964fD4dB808'; // replace with the current instance available on bellecour
async function main() {
  console.log('UpdateEnv Contract at : ', PROTECTED_DATA_SHARING_CONTRACT_ADDRESS);
  const [owner] = await ethers.getSigners();
  console.log('Collection owner: ', owner.address);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'DataProtectorSharing',
    PROTECTED_DATA_SHARING_CONTRACT_ADDRESS,
  );

  const updateEnvTx = await dataProtectorSharingContract.updateEnv(
    'ipfs',
    'https://result.stagingv8.iex.ec',
  );
  await updateEnvTx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
