/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import { getEnvironment } from '@iexec/dataprotector-environments';
import pkg from 'hardhat';
import { createAppFor } from './singleFunction/app.js';
import { createDatasetFor } from './singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from './singleFunction/workerpool.js';

import { DATASET_REGISTRY_ADDRESS } from '../config/config.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

async function main() {
  const { ENV } = process.env;
  console.log(`using ENV: ${ENV}`);
  const { dataprotectorSharingContractAddress } = getEnvironment(ENV);

  console.log('Filling Contract at : ', dataprotectorSharingContractAddress);
  const [owner] = await ethers.getSigners();
  console.log('Collection owner: ', owner.address);

  const dataProtectorSharingContract = await ethers.getContractAt(
    'DataProtectorSharing',
    dataprotectorSharingContractAddress,
  );

  const addOnlyAppWhitelistRegistryContract = await ethers.getContractAt(
    'AddOnlyAppWhitelistRegistry',
    await dataProtectorSharingContract.ADD_ONLY_APP_WHITELIST_REGISTRY(),
  );
  const registry = await ethers.getContractAt('IRegistry', DATASET_REGISTRY_ADDRESS);
  const appAddress = await createAppFor(dataprotectorSharingContractAddress, rpcURL);
  console.log('AppAddress :', appAddress);

  // create new addOnlyAppWhitelistContract
  const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(owner.address);
  const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
  let addOnlyAppWhitelistContractAddress = transactionReceipt.logs.find(({ eventName }) => eventName === 'Transfer')
    ?.args[2];
  addOnlyAppWhitelistContractAddress = ethers.toBeHex(addOnlyAppWhitelistContractAddress);
  console.log('AppWhitelistAddress :', addOnlyAppWhitelistContractAddress);

  // load new app to the appWhitelist
  const addOnlyAppWhitelistContractFactory = await ethers.getContractFactory('AddOnlyAppWhitelist');
  const addOnlyAppWhitelistContract = addOnlyAppWhitelistContractFactory.attach(addOnlyAppWhitelistContractAddress);
  const txAddApp = await addOnlyAppWhitelistContract.addApp(appAddress);
  await txAddApp.wait();

  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder({ iexecWorkerpoolOwner, workerpoolAddress });
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
      const tx1 = await registry.approve(dataprotectorSharingContractAddress, tokenId);
      await tx1.wait();

      const tx2 = await dataProtectorSharingContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
        addOnlyAppWhitelistContractAddress,
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
        subscriptionParams,
      );
      await subscriptionTx.wait();
      const consumeProtectedDataWithSubscriptionTx = await dataProtectorSharingContract.consumeProtectedData(
        protectedDataAddress,
        workerpoolOrder,
        appAddress,
      );
      await consumeProtectedDataWithSubscriptionTx.wait();
    }

    /** *************************************************************************
     *                       Renting                                            *
     ************************************************************************** */
    for (let i = 0; i < 2; i++) {
      const rentingParams = { price: ethers.parseEther('0'), duration: 2_592_000 };
      const protectedDataAddress = await createDatasetFor(owner.address, rpcURL);
      const tokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      const tx1 = await registry.approve(dataprotectorSharingContractAddress, tokenId);
      await tx1.wait();
      const tx2 = await dataProtectorSharingContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
        addOnlyAppWhitelistContractAddress,
      );
      await tx2.wait();
      console.log('ProtectedData added to collection', protectedDataAddress);
      const setProtectedDataToRentingTx = await dataProtectorSharingContract.setProtectedDataToRenting(
        protectedDataAddress,
        rentingParams,
      );
      await setProtectedDataToRentingTx.wait();
      console.log('ProtectedData set into rent mode', protectedDataAddress);

      // Rent a protectedData
      const rentTx = await dataProtectorSharingContract.rentProtectedData(protectedDataAddress, rentingParams);
      await rentTx.wait();
      console.log('ProtectedData rented', protectedDataAddress);
      const consumeProtectedDataWithRentTx = await dataProtectorSharingContract.consumeProtectedData(
        protectedDataAddress,
        workerpoolOrder,
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
      const tx1 = await registry.approve(dataprotectorSharingContractAddress, tokenId);
      await tx1.wait();
      const tx2 = await dataProtectorSharingContract.addProtectedDataToCollection(
        collectionTokenId,
        protectedDataAddress,
        addOnlyAppWhitelistContractAddress,
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
      await dataProtectorSharingContract.buyProtectedData(protectedDataAddress, addr1, salePrice);
      console.log('ProtectedData rented', protectedDataAddress);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
