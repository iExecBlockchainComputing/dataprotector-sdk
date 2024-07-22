/* eslint-disable no-underscore-dangle */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import pkg from 'hardhat';
import { DATASET_REGISTRY_ADDRESS, POCO_ADDRESS } from '../../../config/config.js';
import { createAppFor } from '../../../scripts/singleFunction/app.js';
import { createDatasetFor } from '../../../scripts/singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from '../../../scripts/singleFunction/workerpool.js';
import { VOUCHER_HUB_ADDRESS } from '../../bellecour-fork/voucher-config.js';
import { getEventFromLogs } from '../utils/utils.js';

const { ethers, upgrades } = pkg;
const rpcURL = pkg.network.config.url;

// TODO: Refactor all the file

export async function deploySCFixture() {
  const [owner, addr1, addr2, addr3] = await ethers.getSigners();

  // AddOnlyAppWhitelist
  const AddOnlyAppWhitelistRegistryFactory = await ethers.getContractFactory('AddOnlyAppWhitelistRegistry');
  const addOnlyAppWhitelistRegistryContract = await upgrades.deployProxy(AddOnlyAppWhitelistRegistryFactory, {
    kind: 'transparent',
  });
  await addOnlyAppWhitelistRegistryContract.waitForDeployment();
  const addOnlyAppWhitelistRegistryAddress = await addOnlyAppWhitelistRegistryContract.getAddress();

  // DataProtectorSharing
  const DataProtectorSharingFactory = await ethers.getContractFactory('DataProtectorSharing');
  const dataProtectorSharingContract = await upgrades.deployProxy(DataProtectorSharingFactory, {
    kind: 'transparent',
    constructorArgs: [POCO_ADDRESS, DATASET_REGISTRY_ADDRESS, addOnlyAppWhitelistRegistryAddress, VOUCHER_HUB_ADDRESS],
  });
  await dataProtectorSharingContract.waitForDeployment();

  // Poco
  const pocoContract = await ethers.getContractAt('IExecPocoDelegate', POCO_ADDRESS);

  return {
    DataProtectorSharingFactory,
    dataProtectorSharingContract,
    addOnlyAppWhitelistRegistryContract,
    pocoContract,
    owner,
    addr1,
    addr2,
    addr3,
  };
}

export async function createNonFreeWorkerpoolOrder() {
  const workerpoolprice = 1;
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder({ iexecWorkerpoolOwner, workerpoolAddress, workerpoolprice });
  return {
    workerpoolprice,
    workerpoolOrder,
  };
}

async function createAssets(dataProtectorSharingContract, addr1) {
  const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
  const appAddress = await createAppFor(await dataProtectorSharingContract.getAddress(), rpcURL);
  const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
  const workerpoolOrder = await createWorkerpoolOrder({ iexecWorkerpoolOwner, workerpoolAddress });
  return {
    dataProtectorSharingContract,
    protectedDataAddress,
    appAddress,
    workerpoolOrder,
    addr1,
  };
}

export async function createCollection() {
  const {
    DataProtectorSharingFactory,
    dataProtectorSharingContract,
    addOnlyAppWhitelistRegistryContract,
    pocoContract,
    addr1,
    addr2,
    addr3,
  } = await loadFixture(deploySCFixture);

  const tx = await dataProtectorSharingContract.createCollection(addr1.address);
  const receipt = await tx.wait();
  const specificEventForPreviousTx = getEventFromLogs('Transfer', receipt.logs, {
    strict: true,
  });
  const collectionTokenId = ethers.toNumber(specificEventForPreviousTx.args?.tokenId);

  return {
    DataProtectorSharingFactory,
    dataProtectorSharingContract,
    addOnlyAppWhitelistRegistryContract,
    pocoContract,
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
  const specificEventForTx1 = getEventFromLogs('Transfer', receipt1.logs, {
    strict: true,
  });
  const collectionTokenIdFrom = ethers.toNumber(specificEventForTx1.args?.tokenId);

  // Second one
  const tx2 = await dataProtectorSharingContract.createCollection(addr2.address);
  const receipt2 = await tx2.wait();
  const specificEventForTx2 = getEventFromLogs('Transfer', receipt2.logs, {
    strict: true,
  });
  const collectionTokenIdTo = ethers.toNumber(specificEventForTx2.args?.tokenId);
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
    DataProtectorSharingFactory,
    dataProtectorSharingContract,
    addOnlyAppWhitelistRegistryContract,
    pocoContract,
    collectionTokenId,
    addr1,
    addr2,
    addr3,
  } = await loadFixture(createCollection);
  const { protectedDataAddress, appAddress, workerpoolOrder } = await createAssets(dataProtectorSharingContract, addr1);

  const registry = await ethers.getContractAt('IRegistry', '0x799daa22654128d0c64d5b79eac9283008158730');

  const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
  await registry.connect(addr1).approve(await dataProtectorSharingContract.getAddress(), protectedDataTokenId);

  const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(addr1.address);
  const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
  const addOnlyAppWhitelistTokenId = transactionReceipt.logs.find(({ eventName }) => eventName === 'Transfer')?.args
    .tokenId;
  const addOnlyAppWhitelistContractAddress = ethers.getAddress(ethers.toBeHex(addOnlyAppWhitelistTokenId));

  // load new addOnlyAppWhitelistContract & whitelist an app
  const addOnlyAppWhitelistContractFactory = await ethers.getContractFactory('AddOnlyAppWhitelist');
  const addOnlyAppWhitelistContract = addOnlyAppWhitelistContractFactory.attach(addOnlyAppWhitelistContractAddress);
  await addOnlyAppWhitelistContract.connect(addr1).addApp(appAddress);

  const tx = await dataProtectorSharingContract
    .connect(addr1)
    .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, addOnlyAppWhitelistContractAddress);
  return {
    DataProtectorSharingFactory,
    dataProtectorSharingContract,
    addOnlyAppWhitelistContractAddress,
    pocoContract,
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

export async function setProtectedDataForSale() {
  const {
    dataProtectorSharingContract,
    addOnlyAppWhitelistContractAddress,
    collectionTokenId: collectionTokenIdFrom,
    protectedDataAddress,
    addr1,
    addr2,
  } = await loadFixture(addProtectedDataToCollection);
  const priceParam = 1;

  // Create a recipient collection
  const tx = await dataProtectorSharingContract.createCollection(addr2.address);
  const receipt = await tx.wait();
  const specificEventForPreviousTx = getEventFromLogs('Transfer', receipt.logs, {
    strict: true,
  });
  const collectionTokenIdTo = ethers.toNumber(specificEventForPreviousTx.args?.tokenId);

  await dataProtectorSharingContract.connect(addr1).setProtectedDataForSale(protectedDataAddress, priceParam);

  return {
    dataProtectorSharingContract,
    addOnlyAppWhitelistContractAddress,
    collectionTokenIdFrom,
    collectionTokenIdTo,
    protectedDataAddress,
    addr2,
  };
}

export async function setProtectedDataToSubscription() {
  const { dataProtectorSharingContract, pocoContract, collectionTokenId, protectedDataAddress, addr1, addr2 } =
    await loadFixture(addProtectedDataToCollection);

  // TODO: set as param
  const subscriptionParams = {
    price: 1, // in nRLC
    duration: 1_500,
  };
  await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);

  const setProtectedDataToSubscriptionTx = await dataProtectorSharingContract
    .connect(addr1)
    .setProtectedDataToSubscription(protectedDataAddress);
  const setProtectedDataToSubscriptionReceipt = await setProtectedDataToSubscriptionTx.wait();
  return {
    dataProtectorSharingContract,
    pocoContract,
    protectedDataAddress,
    setProtectedDataToSubscriptionReceipt,
    collectionTokenId,
    subscriptionParams,
    addr1,
    addr2,
  };
}
