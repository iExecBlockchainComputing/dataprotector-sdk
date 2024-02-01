/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import pkg from 'hardhat';
import { createDatasetForContract } from './singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

const PROTECTED_DATA_SHARING_CONTRACT_ADDRESS = '0xA73A3518F629834630ef98E57C573018eA198365';

async function main() {
  console.log('Filling Contract at : ', PROTECTED_DATA_SHARING_CONTRACT_ADDRESS);
  const [owner] = await ethers.getSigners();
  console.log('Collection owner: ', owner.address);

  const protectedDataSharingContract = await ethers.getContractAt(
    'ProtectedDataSharing',
    PROTECTED_DATA_SHARING_CONTRACT_ADDRESS,
  );

  const CollectionFactory = await ethers.getContractFactory('Collection');
  const collectionContract = await CollectionFactory.attach(
    await protectedDataSharingContract.m_collection(),
  );
  console.log('collection contract', await protectedDataSharingContract.m_collection());

  const tx = await collectionContract.createCollection();
  const receipt = await tx.wait();
  const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
  console.log('Collection Id', collectionTokenId);

  const protectedDataAddress = await createDatasetForContract(owner.address, rpcURL);
  // const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
  // const tx1 = await registry.approve(await collectionContract.getAddress(), tokenId);
  // await tx1.wait();
  const tx2 = await collectionContract.addProtectedDataToCollection(
    collectionTokenId,
    protectedDataAddress,
  );
  console.log('tx2', tx2);
  await tx2.wait();
  console.log('ProtectedData added to collection', protectedDataAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
