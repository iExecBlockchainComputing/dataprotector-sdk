/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import pkg from 'hardhat';
import { createAppFor } from './singleFunction/app.js';
import { createDatasetFor } from './singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from './singleFunction/workerpool.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

const PROTECTED_DATA_SHARING_CONTRACT_ADDRESS = '...'; // replace with the current instance available on bellecour
const APP_WHITELIST_REGISTRY_ADDRESS = '...'; // replace with the current instance available on bellecour
async function main() {
  console.log('Filling Contract at : ', PROTECTED_DATA_SHARING_CONTRACT_ADDRESS);
  const [owner] = await ethers.getSigners();
  console.log('Collection owner: ', owner.address);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'DataProtectorSharing',
    PROTECTED_DATA_SHARING_CONTRACT_ADDRESS,
  );
  const appWhitelistRegistryContract = await ethers.getContractAt(
    'AppWhitelistRegistry',
    APP_WHITELIST_REGISTRY_ADDRESS,
  );
  const registry = await ethers.getContractAt('IRegistry', '0x799daa22654128d0c64d5b79eac9283008158730');
  const appAddress = await createAppFor(PROTECTED_DATA_SHARING_CONTRACT_ADDRESS, rpcURL);
  console.log('AppAddress :', appAddress);

  // create new appWhitelistContract
  const newAppWhitelistTx = await appWhitelistRegistryContract.createAppWhitelist(owner.address);
  const transactionReceipt = await newAppWhitelistTx.wait();
  let appWhitelistContractAddress = transactionReceipt.logs.find(({ eventName }) => eventName === 'Transfer')?.args[2];
  appWhitelistContractAddress = ethers.toBeHex(appWhitelistContractAddress);
  console.log('AppWhitelistAddress :', appWhitelistContractAddress);

  // load new app to the appWhitelist
  const appWhitelistContractFactory = await ethers.getContractFactory('AppWhitelist');
  const appWhitelistContract = appWhitelistContractFactory.attach(appWhitelistContractAddress);
  const txAddApp = await appWhitelistContract.addApp(appAddress);
  await txAddApp.wait();

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
        appWhitelistContractAddress,
      );
      await tx2.wait();

      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataToSubscriptionTx =
        await dataProtectorSharingContract.setProtectedDataToSubscription(protectedDataAddress);
      await setProtectedDataToSubscriptionTx.wait();
      console.log('ProtectedData set into subscription mode', protectedDataAddress);

      // Make subscriptions on created collections
      const subscriptionPrice = ethers.parseEther('0');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 2_592_000, // 30 days
      };
      const tx3 = await dataProtectorSharingContract.setSubscriptionParams(collectionTokenId, subscriptionParams);
      await tx3.wait();
      const subscriptionTx = await dataProtectorSharingContract.subscribeToCollection(
        collectionTokenId,
        subscriptionParams.duration,
        {
          value: subscriptionPrice,
        },
      );
      await subscriptionTx.wait();
      const consumeProtectedDataWithSubscriptionTx = await dataProtectorSharingContract.consumeProtectedData(
        protectedDataAddress,
        workerpoolOrder,
        '',
        appAddress,
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
        appWhitelistContractAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataToRentingTx = await dataProtectorSharingContract.setProtectedDataToRenting(
        protectedDataAddress,
        rentingPrice,
        2_592_000, // 30 days
      );
      await setProtectedDataToRentingTx.wait();
      console.log('ProtectedData set into rent mode', protectedDataAddress);

      // Rent a protectedData
      const rentTx = await dataProtectorSharingContract.rentProtectedData(protectedDataAddress, {
        value: rentingPrice,
      });
      await rentTx.wait();
      console.log('ProtectedData rented', protectedDataAddress);
      const consumeProtectedDataWithRentTx = await dataProtectorSharingContract.consumeProtectedData(
        protectedDataAddress,
        workerpoolOrder,
        '',
        appAddress,
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
        appWhitelistContractAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataForSaleTx = await dataProtectorSharingContract.setProtectedDataForSale(
        protectedDataAddress,
        salePrice,
      );
      await setProtectedDataForSaleTx.wait();
      console.log('ProtectedData set into sale mode', protectedDataAddress);
      const addr1 = ethers.Wallet.createRandom().address;
      // Rent a protectedData
      await dataProtectorSharingContract.buyProtectedData(protectedDataAddress, addr1, {
        value: salePrice,
      });
      console.log('ProtectedData rented', protectedDataAddress);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
