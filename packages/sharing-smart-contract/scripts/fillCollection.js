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
  const [owner, addr1] = await ethers.getSigners();
  console.log('Collection owner: ', owner.address);

  const protectedDataSharingContract = await ethers.getContractAt(
    'ProtectedDataSharing',
    PROTECTED_DATA_SHARING_CONTRACT_ADDRESS,
  );
  const registry = await ethers.getContractAt(
    'IDatasetRegistry',
    '0x799daa22654128d0c64d5b79eac9283008158730',
  );

  const CollectionFactory = await ethers.getContractFactory('Collection');
  const collectionContract = await CollectionFactory.attach(
    await protectedDataSharingContract.m_collection(),
  );

  /** *************************************************************************
   *                       Subscription                                       *
   ************************************************************************** */
  for (let k = 0; k < 2; k++) {
    const tx = await collectionContract.createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    console.log('Collection Id', collectionTokenId);

    for (let i = 0; i < 2; i++) {
      const protectedDataAddress = await createDatasetForContract(owner.address, rpcURL);
      const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      const tx1 = await registry.approve(await collectionContract.getAddress(), tokenId);
      await tx1.wait();
      const tx2 = await collectionContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataToSubscriptionTx =
        await protectedDataSharingContract.setProtectedDataToSubscription(
          collectionTokenId,
          protectedDataAddress,
        );
      await setProtectedDataToSubscriptionTx.wait();
      console.log('ProtectedData set into subscription mode', protectedDataAddress);
    }

    // Make subscriptions on created collections
    const subscriptionPrice = ethers.parseEther('0');
    const subscriptionParams = {
      price: subscriptionPrice,
      duration: 15,
    };
    const tx3 = await protectedDataSharingContract.setSubscriptionParams(
      collectionTokenId,
      subscriptionParams,
    );
    await tx3.wait();
    const subscriptionTx = await protectedDataSharingContract.subscribeTo(collectionTokenId, {
      value: subscriptionPrice,
    });
    await subscriptionTx.wait();

    /** *************************************************************************
     *                       Renting                                            *
     ************************************************************************** */
    for (let i = 0; i < 2; i++) {
      const rentingPrice = ethers.parseEther('0');
      const protectedDataAddress = await createDatasetForContract(owner.address, rpcURL);
      const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      const tx1 = await registry.approve(await collectionContract.getAddress(), tokenId);
      await tx1.wait();
      const tx2 = await collectionContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataToRentingTx =
        await protectedDataSharingContract.setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          rentingPrice,
          1_200,
        );
      await setProtectedDataToRentingTx.wait();
      console.log('ProtectedData set into rent mode', protectedDataAddress);

      // Rent a protectedData
      await protectedDataSharingContract.rentProtectedData(
        collectionTokenId,
        protectedDataAddress,
        { value: rentingPrice },
      );
      console.log('ProtectedData rented', protectedDataAddress);
    }

    /** *************************************************************************
     *                       Sale                                               *
     ************************************************************************** */
    for (let i = 0; i < 2; i++) {
      const salePrice = ethers.parseEther('0');
      const protectedDataAddress = await createDatasetForContract(owner.address, rpcURL);
      const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      const tx1 = await registry.approve(await collectionContract.getAddress(), tokenId);
      await tx1.wait();
      const tx2 = await collectionContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataForSaleTx = await protectedDataSharingContract.setProtectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
        salePrice,
      );
      await setProtectedDataForSaleTx.wait();
      console.log('ProtectedData set into sale mode', protectedDataAddress);

      // Rent a protectedData
      await protectedDataSharingContract.buyProtectedData(
        collectionTokenId,
        protectedDataAddress,
        addr1,
        {
          value: salePrice,
        },
      );
      console.log('ProtectedData rented', protectedDataAddress);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
