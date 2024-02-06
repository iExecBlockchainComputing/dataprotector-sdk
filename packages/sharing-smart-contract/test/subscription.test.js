import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from '../config/config.js';
import { createAppForContract } from '../scripts/singleFunction/app.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Subscription', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_APP_REGISTRY_ADDRESS,
      POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
      owner.address,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }

  function subscriptionParamsToArray(params) {
    return [params.price, params.duration];
  }

  async function createCollection() {
    const { protectedDataSharingContract, addr1, addr2 } = await loadFixture(deploySCFixture);
    const tx = await protectedDataSharingContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    const appAddress = await createAppForContract(
      await protectedDataSharingContract.getAddress(),
      rpcURL,
    );
    return { protectedDataSharingContract, collectionTokenId, appAddress, addr1, addr2 };
  }

  async function addProtectedDataToCollection() {
    const { protectedDataSharingContract, collectionTokenId, appAddress, addr1, addr2 } =
      await loadFixture(createCollection);

    const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
    const registry = await ethers.getContractAt(
      'IRegistry',
      '0x799daa22654128d0c64d5b79eac9283008158730',
    );
    const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
    await registry
      .connect(addr1)
      .approve(await protectedDataSharingContract.getAddress(), protectedDataTokenId);
    await protectedDataSharingContract
      .connect(addr1)
      .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, appAddress);
    return {
      protectedDataSharingContract,
      collectionTokenId,
      protectedDataAddress,
      addr1,
      addr2,
    };
  }

  async function setProtectedDataToSubscription() {
    const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1, addr2 } =
      await loadFixture(addProtectedDataToCollection);

    const subscriptionPrice = ethers.parseEther('0.5');
    const subscriptionParams = {
      price: subscriptionPrice,
      duration: 15,
    };
    await protectedDataSharingContract
      .connect(addr1)
      .setSubscriptionParams(collectionTokenId, subscriptionParams);

    const setProtectedDataToSubscriptionTx = await protectedDataSharingContract
      .connect(addr1)
      .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);
    const setProtectedDataToSubscriptionReceipt = await setProtectedDataToSubscriptionTx.wait();
    return {
      protectedDataSharingContract,
      protectedDataAddress,
      setProtectedDataToSubscriptionReceipt,
      collectionTokenId,
      subscriptionPrice,
      addr1,
      addr2,
    };
  }

  describe('subscribeTo()', () => {
    it('should allow a user to subscribe to a collection', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const subscriptionPrice = ethers.parseEther('0.5');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 15,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber))
        .timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      await expect(subscriptionTx)
        .to.emit(protectedDataSharingContract, 'NewSubscription')
        .withArgs(collectionTokenId, addr1.address, expectedEndDate);
      const subscriptionInfo = await protectedDataSharingContract
        .connect(addr1)
        .subscribers(collectionTokenId, addr1.address);
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      expect(ethers.toNumber(subscriptionInfo)).to.equal(expectedEndDate);
      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore - subscriptionPrice);
    });

    it('should revert if subscription parameters are not set', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .subscribeTo(collectionTokenId, { value: ethers.parseEther('0.1') }),
      ).to.be.revertedWith('Subscription parameters not set');
    });

    it('should revert if the subscription price is lower than required', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('1'),
        duration: 30,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .subscribeTo(collectionTokenId, { value: ethers.parseEther('0.5') }),
      ).to.be.revertedWith('Wrong amount sent');
    });

    it('should revert if the subscription price is not equal to value sent', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionPrice = ethers.parseEther('0.5');
      const tokenSended = ethers.parseEther('1.3'); // Send more money than required
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 15,
      };
      const SubscriptionOptionsTx = await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      await SubscriptionOptionsTx.wait();

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: tokenSended });
      await expect(subscriptionTx).to.be.revertedWith('Wrong amount sent');
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore);
    });

    it('should update correctly lastSubscriptionExpiration mapping with multiple subscription', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);
      const subscriptionPrice = ethers.parseEther('0.5');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 15,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const tx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });
      await tx.wait();

      const firstEndTimestamp =
        await protectedDataSharingContract.lastSubscriptionExpiration(collectionTokenId);

      await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });
      expect(
        await protectedDataSharingContract.lastSubscriptionExpiration(collectionTokenId),
      ).to.be.greaterThan(firstEndTimestamp);
    });
  });

  describe('setSubscriptionParams()', () => {
    it('should set and get subscription parameters', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.000001'),
        duration: 30,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const retrievedParamsArray =
        await protectedDataSharingContract.subscriptionParams(collectionTokenId);

      expect(subscriptionParamsToArray(subscriptionParams)).to.deep.equal(retrievedParamsArray);
    });

    it('should emit NewSubscriptionParams event', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 15,
      };

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setSubscriptionParams(collectionTokenId, subscriptionParams),
      )
        .to.emit(protectedDataSharingContract, 'NewSubscriptionParams')
        .withArgs(collectionTokenId, subscriptionParamsToArray(subscriptionParams));
    });
  });

  describe('setProtectedDataToSubscription()', () => {
    it('should set protected data to subscription', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        collectionTokenId,
        setProtectedDataToSubscriptionReceipt,
      } = await loadFixture(setProtectedDataToSubscription);

      expect(setProtectedDataToSubscriptionReceipt)
        .to.emit(protectedDataSharingContract, 'ProtectedDataAddedForSubscription')
        .withArgs([collectionTokenId, protectedDataAddress]);

      const contentInfo = await protectedDataSharingContract.protectedDataInSubscription(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(contentInfo).to.equal(true);
    });

    it('should revert if user does not own the collection', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        addr2: notCollectionOwner,
        collectionTokenId,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract
          .connect(notCollectionOwner)
          .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith("Not the collection's owner");
    });

    it('should revert if trying to set protectedData not own by the collection contract', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData is not in collection');
    });

    it('should revert if trying to set protected data to Subscription available for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract.setProtectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
        ethers.parseEther('0.5'),
      );

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData for sale');
    });
  });

  describe('removeProtectedDataFromSubscription()', () => {
    it('should remove protected data from subscription', async () => {
      const { protectedDataSharingContract, protectedDataAddress, collectionTokenId, addr1 } =
        await loadFixture(setProtectedDataToSubscription);

      const removeProtectedDataToSubscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress);
      const removeProtectedDataToSubscriptionReceipt =
        await removeProtectedDataToSubscriptionTx.wait();

      expect(removeProtectedDataToSubscriptionReceipt)
        .to.emit(protectedDataSharingContract, 'ProtectedDataRemovedFromSubscription')
        .withArgs([collectionTokenId, protectedDataAddress]);

      const contentInfo = await protectedDataSharingContract.protectedDataInSubscription(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(contentInfo).to.equal(false);
    });

    it('should revert if user does not own the collection', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        addr2: notCollectionOwner,
        collectionTokenId,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract
          .connect(notCollectionOwner)
          .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith("Not the collection's owner");
    });

    it('should revert if trying to remove protectedData not own by the collection contract', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData is not in collection');
    });

    it('should revert if trying to remove protectedData with ongoing subscriptions for the collection', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        collectionTokenId,
        subscriptionPrice,
        addr1,
        addr2,
      } = await loadFixture(setProtectedDataToSubscription);

      await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('Collection has ongoing subscriptions');
    });
  });
});
