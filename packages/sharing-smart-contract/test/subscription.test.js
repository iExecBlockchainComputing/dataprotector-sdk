import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetFor } from '../scripts/singleFunction/dataset.js';
import {
  addProtectedDataToCollection,
  createCollection,
  setProtectedDataToSubscription,
} from './utils/loadFixture.test.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Subscription', () => {
  function subscriptionParamsToArray(params) {
    return [params.price, params.duration];
  }

  describe('subscribeToCollection()', () => {
    it.only('should add the user to the subscribers', async () => {
      const { dataProtectorSharingContract, pocoContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const subscriptionParams = {
        price: ethers.parseEther('0.05'),
        duration: 15,
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = await dataProtectorSharingContract
        .connect(addr1)
        .subscribeToCollection(collectionTokenId, subscriptionParams.duration, {
          value: subscriptionParams.price,
        });
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber))
        .timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      const subscriptionEndDate = await dataProtectorSharingContract.getCollectionSubscriber(
        collectionTokenId,
        addr1.address,
      );
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      const collectionTokenIdOwner = await dataProtectorSharingContract.ownerOf(collectionTokenId);
      const collectionOwnerBalance = await pocoContract.balanceOf(collectionTokenIdOwner);

      expect(collectionOwnerBalance).to.equal(subscriptionParams.price);
      expect(ethers.toNumber(subscriptionEndDate)).to.equal(expectedEndDate);
      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore - subscriptionParams.price);
    });

    it('should emit NewSubscription event', async () => {
      const { dataProtectorSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.05'),
        duration: 15,
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);

      const subscriptionTx = await dataProtectorSharingContract
        .connect(addr1)
        .subscribeToCollection(collectionTokenId, subscriptionParams.duration, {
          value: subscriptionParams.price,
        });
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber))
        .timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      await expect(subscriptionTx)
        .to.emit(dataProtectorSharingContract, 'NewSubscription')
        .withArgs(collectionTokenId, addr1.address, expectedEndDate);
    });

    it('should revert if subscription parameters are not set', async () => {
      const { dataProtectorSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .subscribeToCollection(collectionTokenId, 15, { value: ethers.parseEther('0.01') }),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'InvalidSubscriptionDuration');
    });

    it('should revert if the subscription price is not equal to value sent', async () => {
      const { dataProtectorSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const tokenSended = ethers.parseEther('1.3'); // Send more money than required
      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 15,
      };
      const SubscriptionOptionsTx = await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      await SubscriptionOptionsTx.wait();

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = dataProtectorSharingContract
        .connect(addr1)
        .subscribeToCollection(collectionTokenId, subscriptionParams.duration, {
          value: tokenSended,
        });
      await expect(subscriptionTx).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'WrongAmountSent',
      );
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore);
    });

    it('should extend lastSubscriptionExpiration when a user take a subscription ending after the previous lastSubscriptionExpiration', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 48 * 60 * 60, // 48h
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const firstSubscriptionTx = await dataProtectorSharingContract
        .connect(addr1)
        .subscribeToCollection(collectionTokenId, subscriptionParams.duration, {
          value: subscriptionParams.price,
        });
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber)
      ).timestamp;
      // extends lastSubscriptionExpiration
      expect(
        (await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1],
      ).to.be.equal(firstSubscriptionBlockTimestamp + subscriptionParams.duration);

      const secondSubscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams.duration, {
          value: subscriptionParams.price,
        });
      const secondSubscriptionReceipt = await secondSubscriptionTx.wait();
      const secondSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(secondSubscriptionReceipt.blockNumber)
      ).timestamp;
      // extends lastSubscriptionExpiration
      expect(
        (await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1],
      ).to.be.equal(secondSubscriptionBlockTimestamp + subscriptionParams.duration);
    });

    it('should not extend lastSubscriptionExpiration when a user take a subscription ending before the previous lastSubscriptionExpiration', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 48 * 60 * 60, // 48h
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const firstSubscriptionTx = await dataProtectorSharingContract
        .connect(addr1)
        .subscribeToCollection(collectionTokenId, subscriptionParams.duration, {
          value: subscriptionParams.price,
        });
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber)
      ).timestamp;
      const firstSubscriptionEnd = firstSubscriptionBlockTimestamp + subscriptionParams.duration;
      // extends lastSubscriptionExpiration
      expect(
        (await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1],
      ).to.be.equal(firstSubscriptionEnd);

      // update subscription params for next subscribers
      const newSubscriptionParams = {
        price: subscriptionParams.price,
        duration: 24 * 60 * 60, // 24h
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, newSubscriptionParams);

      // subscribe with new subscription params
      const secondSubscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, newSubscriptionParams.duration, {
          value: subscriptionParams.price,
        });
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
        (await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1],
      ).to.be.equal(firstSubscriptionBlockTimestamp + subscriptionParams.duration);
    });
  });

  describe('subscribeToCollectionWithAccount()', () => {
    it('should add the user to the subscribers', async () => {
      const { dataProtectorSharingContract, pocoContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const subscriptionParams = {
        price: ethers.parseEther('0.05'),
        duration: 15,
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      // approve DataProtectorSharing contract to spend
      await pocoContract
        .connect(addr1)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr1).deposit(subscriptionParams.price);

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = await dataProtectorSharingContract
        .connect(addr1)
        .subscribeToCollectionWithAccount(collectionTokenId, subscriptionParams.duration);
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber))
        .timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      const subscriptionEndDate = await dataProtectorSharingContract.getCollectionSubscriber(
        collectionTokenId,
        addr1.address,
      );
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      const collectionTokenIdOwner = await dataProtectorSharingContract.ownerOf(collectionTokenId);
      const collectionOwnerBalance = await pocoContract.balanceOf(collectionTokenIdOwner);

      expect(collectionOwnerBalance).to.equal(subscriptionParams.price);
      expect(ethers.toNumber(subscriptionEndDate)).to.equal(expectedEndDate);
      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore - subscriptionParams.price);
    });
  });

  describe('setSubscriptionParams()', () => {
    it('should set subscription parameters', async () => {
      const { dataProtectorSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.000001'),
        duration: 30,
      };
      await dataProtectorSharingContract;
      await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const retrievedParamsArray = (
        await dataProtectorSharingContract.collectionDetails(collectionTokenId)
      )[2];

      expect(subscriptionParamsToArray(subscriptionParams)).to.deep.equal(retrievedParamsArray);
    });

    it('should emit NewSubscriptionParams event', async () => {
      const { dataProtectorSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.05'),
        duration: 15,
      };

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setSubscriptionParams(collectionTokenId, subscriptionParams),
      )
        .to.emit(dataProtectorSharingContract, 'NewSubscriptionParams')
        .withArgs(collectionTokenId, subscriptionParamsToArray(subscriptionParams));
    });
  });

  describe('setProtectedDataToSubscription()', () => {
    it('should set protectedData to subscription', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        collectionTokenId,
        setProtectedDataToSubscriptionReceipt,
      } = await loadFixture(setProtectedDataToSubscription);

      expect(setProtectedDataToSubscriptionReceipt)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataAddedForSubscription')
        .to.emit(dataProtectorSharingContract, 'ProtectedDataAddedForSubscription')
        .withArgs([collectionTokenId, protectedDataAddress]);

      const subscriptionDuration = (
        await dataProtectorSharingContract.collectionDetails(collectionTokenId)
      )[2][1]; // duration should be greater than 0
      expect(ethers.toNumber(subscriptionDuration)).to.greaterThan(0);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .setProtectedDataToSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if trying to set protectedData not own by the collection contract', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if trying to set protectedData to Subscription available for sale', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );

      await dataProtectorSharingContract;
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, ethers.parseEther('0.5'));

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ProtectedDataForSale');
    });
  });

  describe('removeProtectedDataFromSubscription()', () => {
    it('should remove protectedData from subscription', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, collectionTokenId, addr1 } =
        await loadFixture(setProtectedDataToSubscription);

      const removeProtectedDataToSubscriptionTx = await dataProtectorSharingContract
        .connect(addr1)
        .removeProtectedDataFromSubscription(protectedDataAddress);
      const removeProtectedDataToSubscriptionReceipt =
        await removeProtectedDataToSubscriptionTx.wait();

      expect(removeProtectedDataToSubscriptionReceipt)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataRemovedFromSubscription')
        .withArgs([collectionTokenId, protectedDataAddress]);

      const subscriptionDuration = (
        await dataProtectorSharingContract.collectionDetails(collectionTokenId)
      )[2][0];
      expect(ethers.toNumber(subscriptionDuration)).to.equal(0);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .removeProtectedDataFromSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataFromSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if trying to remove protectedData with ongoing subscriptions for the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        collectionTokenId,
        subscriptionParams,
        addr1,
        addr2,
      } = await loadFixture(setProtectedDataToSubscription);

      await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams.duration, {
          value: subscriptionParams.price,
        });

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataFromSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'OnGoingCollectionSubscriptions',
      );
    });
  });
});
