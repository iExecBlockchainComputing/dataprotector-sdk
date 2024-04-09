import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetFor } from '../../scripts/singleFunction/dataset.js';
import {
  addProtectedDataToCollection,
  createCollection,
  setProtectedDataToSubscription,
} from './utils/loadFixture.test.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Subscription', () => {
  const subscriptionParams = {
    price: 1, // en nRLC
    duration: 1_500,
  };

  function subscriptionParamsToArray(params) {
    return [params.price, params.duration];
  }

  describe('subscribeToCollection()', () => {
    it('should add the user to the subscribers', async () => {
      const { dataProtectorSharingContract, pocoContract, addr1, addr2, collectionTokenId } =
        await loadFixture(createCollection);

      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);

      const collectionTokenIdOwner = await dataProtectorSharingContract.ownerOf(collectionTokenId);
      const collectionOwnerBalanceBefore = await pocoContract.balanceOf(collectionTokenIdOwner);

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr2.address);
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      const subscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber)).timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      const subscriptionEndDate = await dataProtectorSharingContract.getCollectionSubscriber(
        collectionTokenId,
        addr2.address,
      );
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr2.address);

      const collectionOwnerBalanceAfter = await pocoContract.balanceOf(collectionTokenIdOwner);

      expect(collectionOwnerBalanceAfter).to.equal(collectionOwnerBalanceBefore + BigInt(subscriptionParams.price));
      expect(ethers.toNumber(subscriptionEndDate)).to.equal(expectedEndDate);
      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(
        subscriberBalanceBefore - ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      );
      await expect(subscriptionReceipt)
        .to.emit(dataProtectorSharingContract, 'NewSubscription')
        .withArgs(collectionTokenId, addr2.address, expectedEndDate);
    });

    it('should emit NewSubscription event', async () => {
      const { dataProtectorSharingContract, pocoContract, addr1, addr2, collectionTokenId } =
        await loadFixture(createCollection);

      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      const subscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber)).timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      await expect(subscriptionTx)
        .to.emit(dataProtectorSharingContract, 'NewSubscription')
        .withArgs(collectionTokenId, addr2.address, expectedEndDate);
    });

    it('should revert if subscription parameters are not set', async () => {
      const { dataProtectorSharingContract, addr2, collectionTokenId } = await loadFixture(createCollection);

      await expect(
        dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'InvalidSubscriptionParams');
    });

    it('should revert if amount set is not the current collection price', async () => {
      const { dataProtectorSharingContract, addr1, addr2, collectionTokenId } = await loadFixture(createCollection);

      const SubscriptionOptionsTx = await dataProtectorSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      await SubscriptionOptionsTx.wait();

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, {
        price: subscriptionParams.price * 2,
        duration: subscriptionParams.duration,
      });
      await expect(subscriptionTx).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'InvalidSubscriptionParams',
      );
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore);
    });

    it('should extend lastSubscriptionExpiration when a user take a subscription ending after the previous lastSubscriptionExpiration', async () => {
      const { dataProtectorSharingContract, pocoContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price * 2);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits((subscriptionParams.price * 2).toString(), 'gwei'),
      }); // value sent should be in wei
      const firstSubscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber))
        .timestamp;
      // extends lastSubscriptionExpiration
      expect((await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1]).to.be.equal(
        firstSubscriptionBlockTimestamp + subscriptionParams.duration,
      );

      const secondSubscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      const secondSubscriptionReceipt = await secondSubscriptionTx.wait();
      const secondSubscriptionBlockTimestamp = (await ethers.provider.getBlock(secondSubscriptionReceipt.blockNumber))
        .timestamp;
      // extends lastSubscriptionExpiration
      expect((await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1]).to.be.equal(
        secondSubscriptionBlockTimestamp + subscriptionParams.duration,
      );
    });

    it('should not extend lastSubscriptionExpiration when a user take a subscription ending before the previous lastSubscriptionExpiration', async () => {
      const { dataProtectorSharingContract, pocoContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      const subscriptionDuration = 48 * 60 * 60; // 48h
      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, {
        price: subscriptionParams.price,
        duration: subscriptionDuration,
      });
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price * 2);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits((subscriptionParams.price * 2).toString(), 'gwei'),
      }); // value sent should be in wei
      const firstSubscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, {
          price: subscriptionParams.price,
          duration: subscriptionDuration,
        });
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber))
        .timestamp;
      const firstSubscriptionEnd = firstSubscriptionBlockTimestamp + subscriptionDuration;
      // extends lastSubscriptionExpiration
      expect((await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1]).to.be.equal(
        firstSubscriptionEnd,
      );

      // update subscription params for next subscribers
      const newSubscriptionDuration = 24 * 60 * 60; // 24h
      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, {
        price: subscriptionParams.price,
        duration: newSubscriptionDuration,
      });

      // subscribe with new subscription params
      const secondSubscriptionTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, {
          price: subscriptionParams.price,
          duration: newSubscriptionDuration,
        });
      const secondSubscriptionReceipt = await secondSubscriptionTx.wait();
      const secondSubscriptionBlockTimestamp = (await ethers.provider.getBlock(secondSubscriptionReceipt.blockNumber))
        .timestamp;
      const secondSubscriptionEnd = secondSubscriptionBlockTimestamp + newSubscriptionDuration;

      // secondSubscription ends before firstSubscription
      expect(firstSubscriptionEnd).to.be.greaterThan(secondSubscriptionEnd);

      // secondSubscription does not extend lastSubscriptionExpiration
      expect((await dataProtectorSharingContract.collectionDetails(collectionTokenId))[1]).to.be.equal(
        firstSubscriptionEnd,
      );
    });

    it('should make a subscription with an approveAndCall', async () => {
      const {
        DataProtectorSharingFactory,
        dataProtectorSharingContract,
        pocoContract,
        addr1,
        addr2,
        collectionTokenId,
      } = await loadFixture(createCollection);

      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);

      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      const callData = DataProtectorSharingFactory.interface.encodeFunctionData('subscribeToCollection', [
        collectionTokenId,
        subscriptionParams,
      ]);

      const subscriptionTx = await pocoContract
        .connect(addr2)
        .approveAndCall(await dataProtectorSharingContract.getAddress(), subscriptionParams.price, callData);
      const subscriptionReceipt = await subscriptionTx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber)).timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      const subscriptionEndDate = await dataProtectorSharingContract.getCollectionSubscriber(
        collectionTokenId,
        addr2.address,
      );
      expect(ethers.toNumber(subscriptionEndDate)).to.equal(expectedEndDate);
      await expect(subscriptionReceipt)
        .to.emit(dataProtectorSharingContract, 'NewSubscription')
        .withArgs(collectionTokenId, addr2.address, expectedEndDate);
    });
  });

  describe('setSubscriptionParams()', () => {
    it('should set subscription parameters', async () => {
      const { dataProtectorSharingContract, addr1, collectionTokenId } = await loadFixture(createCollection);

      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);
      const retrievedParamsArray = (await dataProtectorSharingContract.collectionDetails(collectionTokenId))[2];

      expect(subscriptionParamsToArray(subscriptionParams)).to.deep.equal(retrievedParamsArray);
    });

    it('should emit NewSubscriptionParams event', async () => {
      const { dataProtectorSharingContract, addr1, collectionTokenId } = await loadFixture(createCollection);

      await expect(
        dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams),
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
        .withArgs(collectionTokenId, protectedDataAddress);

      const subscriptionDuration = (await dataProtectorSharingContract.collectionDetails(collectionTokenId))[2][1]; // duration should be greater than 0
      expect(ethers.toNumber(subscriptionDuration)).to.greaterThan(0);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract.connect(notCollectionOwner).setProtectedDataToSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOperator');
    });

    it('should revert if trying to set protectedData not own by the collection contract', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract.connect(addr1).setProtectedDataToSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if trying to set protectedData to Subscription available for sale', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract.connect(addr1).setProtectedDataForSale(protectedDataAddress, 1);

      await expect(
        dataProtectorSharingContract.connect(addr1).setProtectedDataToSubscription(protectedDataAddress),
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
      const removeProtectedDataToSubscriptionReceipt = await removeProtectedDataToSubscriptionTx.wait();

      expect(removeProtectedDataToSubscriptionReceipt)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataRemovedFromSubscription')
        .withArgs(collectionTokenId, protectedDataAddress);

      const isInSubscription = (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[3];
      expect(isInSubscription).to.be.false;
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
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOperator');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract.connect(addr1).removeProtectedDataFromSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if trying to remove protectedData with ongoing subscriptions for the collection', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        collectionTokenId,
        subscriptionParams,
        addr1,
        addr2,
      } = await loadFixture(setProtectedDataToSubscription);

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      await expect(
        dataProtectorSharingContract.connect(addr1).removeProtectedDataFromSubscription(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'OnGoingCollectionSubscriptions');
    });
  });
});
