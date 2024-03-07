/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import pkg from 'hardhat';
import { createAppFor } from './singleFunction/app.js';
import { createDatasetFor } from './singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from './singleFunction/workerpool.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

const PROTECTED_DATA_SHARING_CONTRACT_ADDRESS = ''; // replace with the current instance available on bellecour

async function main() {
  console.log('Filling Contract at : ', PROTECTED_DATA_SHARING_CONTRACT_ADDRESS);
  const [owner] = await ethers.getSigners();
  console.log('Collection owner: ', owner.address);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'ProtectedDataSharing',
    PROTECTED_DATA_SHARING_CONTRACT_ADDRESS,
  );
  const registry = await ethers.getContractAt(
    'IRegistry',
    '0x799daa22654128d0c64d5b79eac9283008158730',
  );
  const appAddress = await createAppFor(PROTECTED_DATA_SHARING_CONTRACT_ADDRESS, rpcURL);
  console.log('AppAddress :', appAddress);
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder(iexecWorkerpoolOwner, workerpoolAddress);
  /** *************************************************************************
   *                       Subscription                                       *
   ************************************************************************** */
  for (let k = 0; k < 2; k++) {
    const tx = await dataProtectorSharingContract.createCollection(owner.address);
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    console.log('Collection Id', collectionTokenId);

    for (let i = 0; i < 2; i++) {
      const protectedDataAddress = await createDatasetFor(owner.address, rpcURL);
      const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      const tx1 = await registry.approve(PROTECTED_DATA_SHARING_CONTRACT_ADDRESS, tokenId);
      await tx1.wait();
      const tx2 = await dataProtectorSharingContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
        appAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataToSubscriptionTx =
        await dataProtectorSharingContract.setProtectedDataToSubscription(
          collectionTokenId,
          protectedDataAddress,
        );
      await setProtectedDataToSubscriptionTx.wait();
      console.log('ProtectedData set into subscription mode', protectedDataAddress);

      // Make subscriptions on created collections
      const subscriptionPrice = ethers.parseEther('0');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 2_592_000, // 30 days
      };
      const tx3 = await dataProtectorSharingContract.setSubscriptionParams(
        collectionTokenId,
        subscriptionParams,
      );
      await tx3.wait();
      const subscriptionTx = await dataProtectorSharingContract.subscribeTo(collectionTokenId, {
        value: subscriptionPrice,
      });
      await subscriptionTx.wait();
      const consumeProtectedDataWithSubscriptionTx =
        await dataProtectorSharingContract.consumeProtectedData(
          collectionTokenId,
          protectedDataAddress,
          workerpoolOrder,
          '',
        );
      await consumeProtectedDataWithSubscriptionTx.wait();
    }

    /** *************************************************************************
     *                       Renting                                            *
     ************************************************************************** */
    for (let i = 0; i < 2; i++) {
      const rentingPrice = ethers.parseEther('0');
      const protectedDataAddress = await createDatasetFor(owner.address, rpcURL);
      const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      const tx1 = await registry.approve(PROTECTED_DATA_SHARING_CONTRACT_ADDRESS, tokenId);
      await tx1.wait();
      const tx2 = await dataProtectorSharingContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
        appAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataToRentingTx =
        await dataProtectorSharingContract.setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          rentingPrice,
          2_592_000, // 30 days
        );
      await setProtectedDataToRentingTx.wait();
      console.log('ProtectedData set into rent mode', protectedDataAddress);

      // Rent a protectedData
      const rentTx = await dataProtectorSharingContract.rentProtectedData(
        collectionTokenId,
        protectedDataAddress,
        { value: rentingPrice },
      );
      await rentTx.wait();
      console.log('ProtectedData rented', protectedDataAddress);
      const consumeProtectedDataWithRentTx =
        await dataProtectorSharingContract.consumeProtectedData(
          collectionTokenId,
          protectedDataAddress,
          workerpoolOrder,
          '',
        );
      await consumeProtectedDataWithRentTx.wait();
    }

    /** *************************************************************************
     *                       Sale                                               *
     ************************************************************************** */
    for (let i = 0; i < 2; i++) {
      const salePrice = ethers.parseEther('0');
      const protectedDataAddress = await createDatasetFor(owner.address, rpcURL);
      const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      const tx1 = await registry.approve(PROTECTED_DATA_SHARING_CONTRACT_ADDRESS, tokenId);
      await tx1.wait();
      const tx2 = await dataProtectorSharingContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
        appAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataForSaleTx = await dataProtectorSharingContract.setProtectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
        salePrice,
      );
      await setProtectedDataForSaleTx.wait();
      console.log('ProtectedData set into sale mode', protectedDataAddress);
      const addr1 = ethers.Wallet.createRandom().address;
      // Rent a protectedData
      await dataProtectorSharingContract.buyProtectedData(
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
