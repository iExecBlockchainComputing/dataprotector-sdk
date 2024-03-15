/* eslint-disable no-underscore-dangle */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import pkg from 'hardhat';
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from '../../config/config.js';
import { createAppFor } from '../../scripts/singleFunction/app.js';
import { createDatasetFor } from '../../scripts/singleFunction/dataset.js';
import {
  createWorkerpool,
  createWorkerpoolOrder,
} from '../../scripts/singleFunction/workerpool.js';

const { ethers, upgrades } = pkg;
const rpcURL = pkg.network.config.url;

export async function deploySCFixture() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();

  const AppWhitelistRegistryFactory = await ethers.getContractFactory('AppWhitelistRegistry');
  const appWhitelistRegistryContract = await upgrades.deployProxy(
    AppWhitelistRegistryFactory,
    [
      /* wait for dataProtectorSharingContract deployment to know its address */
    ],
    {
      initializer: false,
      kind: 'transparent',
      constructorArgs: [POCO_APP_REGISTRY_ADDRESS],
    },
  );
  await appWhitelistRegistryContract.waitForDeployment();

  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');
  const dataProtectorSharingContract = await upgrades.deployProxy(
    DataProtectorSharingFactory,
    [owner.address],
    {
      kind: 'transparent',
      constructorArgs: [
        POCO_PROXY_ADDRESS,
        POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
        await appWhitelistRegistryContract.getAddress(),
      ],
    },
  );
  await dataProtectorSharingContract.waitForDeployment();
  // initialize appWhitelistRegistryContract
  await appWhitelistRegistryContract.initialize(await dataProtectorSharingContract.getAddress());

  return { dataProtectorSharingContract, appWhitelistRegistryContract, owner, addr1, addr2, addr3 };
}

async function createAssets(dataProtectorSharingContract, addr1) {
  const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
  const appAddress = await createAppFor(await dataProtectorSharingContract.getAddress(), rpcURL);
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder(iexecWorkerpoolOwner, workerpoolAddress);
  return {
    dataProtectorSharingContract,
    protectedDataAddress,
    appAddress,
    workerpoolOrder,
    addr1,
  };
}

export async function createCollection() {
  const { dataProtectorSharingContract, appWhitelistRegistryContract, addr1, addr2, addr3 } =
    await loadFixture(deploySCFixture);

  const tx = await dataProtectorSharingContract.createCollection(addr1.address);
  const receipt = await tx.wait();
  const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

  return {
    dataProtectorSharingContract,
    appWhitelistRegistryContract,
    collectionTokenId,
    addr1,
    addr2,
    addr3,
  };
}

export async function createTwoCollection() {
  const { dataProtectorSharingContract, addr1, addr2 } = await loadFixture(deploySCFixture);
  // First one
  const tx1 = await dataProtectorSharingContract.createCollection(addr1.address);
  const receipt1 = await tx1.wait();
  const collectionTokenIdFrom = ethers.toNumber(receipt1.logs[0].args[2]);

  // Second one
  const tx2 = await dataProtectorSharingContract.createCollection(addr2.address);
  const receipt2 = await tx2.wait();
  const collectionTokenIdTo = ethers.toNumber(receipt2.logs[0].args[2]);
  return {
    dataProtectorSharingContract,
    collectionTokenIdFrom,
    collectionTokenIdTo,
    addr1,
    addr2,
  };
}

export async function addProtectedDataToCollection() {
  const {
    dataProtectorSharingContract,
    appWhitelistRegistryContract,
    collectionTokenId,
    addr1,
    addr2,
    addr3,
  } = await loadFixture(createCollection);
  const { protectedDataAddress, appAddress, workerpoolOrder } = await createAssets(
    dataProtectorSharingContract,
    addr1,
  );

  const registry = await ethers.getContractAt(
    'IRegistry',
    '0x799daa22654128d0c64d5b79eac9283008158730',
  );

  const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
  await registry
    .connect(addr1)
    .approve(await dataProtectorSharingContract.getAddress(), protectedDataTokenId);

  const newAppWhitelistTx = await appWhitelistRegistryContract.createAppWhitelist(addr1.address);
  const transactionReceipt = await newAppWhitelistTx.wait();
  const appWhitelistContractAddress = transactionReceipt.logs.find(
    ({ eventName }) => eventName === 'AppWhitelistCreated',
  )?.args[0];

  // load new appWhitelistContract & whitelist an app
  const appWhitelistContractFactory = await ethers.getContractFactory('AppWhitelist');
  const appWhitelistContract = appWhitelistContractFactory.attach(appWhitelistContractAddress);
  await appWhitelistContract.connect(addr1).addApp(appAddress);

  const tx = await dataProtectorSharingContract
    .connect(addr1)
    .addProtectedDataToCollection(
      collectionTokenId,
      protectedDataAddress,
      appWhitelistContractAddress,
    );
  return {
    dataProtectorSharingContract,
    appWhitelistContractAddress,
    collectionTokenId,
    protectedDataAddress,
    appAddress,
    workerpoolOrder,
    addr1,
    addr2,
    addr3,
    tx,
  };
}

export async function createCollectionWithProtectedDataRatableAndSubscribable() {
  const {
    dataProtectorSharingContract,
    collectionTokenId,
    protectedDataAddress,
    appAddress,
    workerpoolOrder,
    addr1,
    addr2,
  } = await loadFixture(addProtectedDataToCollection);

  // TODO: set as param
  // set up subscription
  const subscriptionParams = {
    price: ethers.parseEther('0.05'),
    duration: 2_592_000, // 30 days
  };
  await dataProtectorSharingContract
    .connect(addr1)
    .setSubscriptionParams(collectionTokenId, subscriptionParams);
  await dataProtectorSharingContract
    .connect(addr1)
    .setProtectedDataToSubscription(protectedDataAddress);

  // TODO: set as param
  // set up renting
  const rentingParams = {
    price: ethers.parseEther('0.07'),
    duration: 172_800, // 2 days
  };
  await dataProtectorSharingContract
    .connect(addr1)
    .setProtectedDataToRenting(protectedDataAddress, rentingParams.price, rentingParams.duration);
  return {
    dataProtectorSharingContract,
    protectedDataAddress,
    appAddress,
    workerpoolOrder,
    collectionTokenId,
    subscriptionParams,
    rentingParams,
    addr2,
  };
}

export async function setProtectedDataForSale() {
  const {
    dataProtectorSharingContract,
    appWhitelistContractAddress,
    collectionTokenId: collectionTokenIdFrom,
    protectedDataAddress,
    addr1,
    addr2,
  } = await loadFixture(addProtectedDataToCollection);
  const priceParam = ethers.parseEther('0.5');

  // Create a recipient collection
  const tx = await dataProtectorSharingContract.createCollection(addr2.address);
  const receipt = await tx.wait();
  const collectionTokenIdTo = ethers.toNumber(receipt.logs[0].args[2]);

  await dataProtectorSharingContract
    .connect(addr1)
    .setProtectedDataForSale(protectedDataAddress, priceParam);

  return {
    dataProtectorSharingContract,
    appWhitelistContractAddress,
    collectionTokenIdFrom,
    collectionTokenIdTo,
    protectedDataAddress,
    addr2,
  };
}

export async function setProtectedDataToSubscription() {
  const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1, addr2 } =
    await loadFixture(addProtectedDataToCollection);

  // TODO: set as param
  const subscriptionParams = {
    price: ethers.parseEther('0.05'),
    duration: 15,
  };
  await dataProtectorSharingContract
    .connect(addr1)
    .setSubscriptionParams(collectionTokenId, subscriptionParams);

  const setProtectedDataToSubscriptionTx = await dataProtectorSharingContract
    .connect(addr1)
    .setProtectedDataToSubscription(protectedDataAddress);
  const setProtectedDataToSubscriptionReceipt = await setProtectedDataToSubscriptionTx.wait();
  return {
    dataProtectorSharingContract,
    protectedDataAddress,
    setProtectedDataToSubscriptionReceipt,
    collectionTokenId,
    subscriptionParams,
    addr1,
    addr2,
  };
}
