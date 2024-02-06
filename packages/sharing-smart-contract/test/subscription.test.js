import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from '../config/config.js';
import { createAppFor } from '../scripts/singleFunction/app.js';
import { createDatasetFor } from '../scripts/singleFunction/dataset.js';

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
    const appAddress = await createAppFor(await protectedDataSharingContract.getAddress(), rpcURL);
    return { protectedDataSharingContract, collectionTokenId, appAddress, addr1, addr2 };
  }

  async function addProtectedDataToCollection() {
    const { protectedDataSharingContract, collectionTokenId, appAddress, addr1, addr2 } =
      await loadFixture(createCollection);

    const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
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
    it('should add the user to the subscribers', async () => {
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

      const subscriptionInfo = await protectedDataSharingContract
        .connect(addr1)
        .subscribers(collectionTokenId, addr1.address);
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      expect(ethers.toNumber(subscriptionInfo)).to.equal(expectedEndDate);
      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore - subscriptionPrice);
    });

    it('should emit NewSubscription event', async () => {
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

    it('should extend lastSubscriptionExpiration when a user take a subscription ending after the previous lastSubscriptionExpiration', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);
      const subscriptionPrice = ethers.parseEther('0.5');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 48 * 60 * 60, // 48h
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const firstSubscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber)
      ).timestamp;
      // extends lastSubscriptionExpiration
      expect(
        await protectedDataSharingContract.lastSubscriptionExpiration(collectionTokenId),
      ).to.be.equal(firstSubscriptionBlockTimestamp + subscriptionParams.duration);

      const secondSubscriptionTx = await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });
      const secondSubscriptionReceipt = await secondSubscriptionTx.wait();
      const secondSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(secondSubscriptionReceipt.blockNumber)
      ).timestamp;
      // extends lastSubscriptionExpiration
      expect(
        await protectedDataSharingContract.lastSubscriptionExpiration(collectionTokenId),
      ).to.be.equal(secondSubscriptionBlockTimestamp + subscriptionParams.duration);
    });

    it('should not extend lastSubscriptionExpiration when a user take a subscription ending before the previous lastSubscriptionExpiration', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);
      const subscriptionPrice = ethers.parseEther('0.5');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 48 * 60 * 60, // 48h
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const firstSubscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber)
      ).timestamp;
      const firstSubscriptionEnd = firstSubscriptionBlockTimestamp + subscriptionParams.duration;
      // extends lastSubscriptionExpiration
      expect(
        await protectedDataSharingContract.lastSubscriptionExpiration(collectionTokenId),
      ).to.be.equal(firstSubscriptionEnd);

      // update subscription params for next subscribers
      const newSubscriptionParams = {
        price: subscriptionPrice,
        duration: 24 * 60 * 60, // 24h
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, newSubscriptionParams);

      // subscribe with new subscription params
      const secondSubscriptionTx = await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });
      const secondSubscriptionReceipt = await secondSubscriptionTx.wait();
      const secondSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(secondSubscriptionReceipt.blockNumber)
      ).timestamp;
      const secondSubscriptionEnd =
        secondSubscriptionBlockTimestamp + newSubscriptionParams.duration;

      // secondSubscription ends before firstSubscription
      expect(firstSubscriptionEnd).to.be.greaterThan(secondSubscriptionEnd);

      // secondSubscription does not extend lastSubscriptionExpiration
      expect(
        await protectedDataSharingContract.lastSubscriptionExpiration(collectionTokenId),
      ).to.be.equal(firstSubscriptionBlockTimestamp + subscriptionParams.duration);
    });
  });

  describe('setSubscriptionParams()', () => {
    it('should set subscription parameters', async () => {
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
    it('should set protectedData to subscription', async () => {
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

    it('should revert if the user does not own the collection', async () => {
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
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData is not in collection');
    });

    it('should revert if trying to set protectedData to Subscription available for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, ethers.parseEther('0.5'));

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData for sale');
    });
  });

  describe('removeProtectedDataFromSubscription()', () => {
    it('should remove protectedData from subscription', async () => {
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

    it('should revert if the user does not own the collection', async () => {
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

    it('should revert if the protectedData is not in the collection', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

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
