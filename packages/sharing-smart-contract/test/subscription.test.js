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

const { ethers, upgrades } = pkg;
const rpcURL = pkg.network.config.url;

describe('Subscription', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await upgrades.deployProxy(
      ProtectedDataSharingFactory,
      [owner.address],
      {
        kind: 'transparent',
        constructorArgs: [
          POCO_PROXY_ADDRESS,
          POCO_APP_REGISTRY_ADDRESS,
          POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
        ],
      },
    );
    await protectedDataSharingContract.waitForDeployment();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }

  function subscriptionParamsToArray(params) {
    return [params.price, params.duration];
  }

  async function createCollection() {
    const { protectedDataSharingContract, addr1, addr2 } = await loadFixture(deploySCFixture);
    const tx = await protectedDataSharingContract.connect(addr1).createCollection(addr1.address);
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

    const subscriptionParams = {
      price: ethers.parseEther('0.5'),
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
      subscriptionParams,
      addr1,
      addr2,
    };
  }

  describe('subscribeTo()', () => {
    it('should add the user to the subscribers', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 15,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber))
        .timestamp;
      const expectedEndDate = blockTimestamp + subscriptionParams.duration;

      // TODO: How to check that
      const subscriptionEndDate =
        await await protectedDataSharingContract.collectionDetails(collectionTokenId);
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      expect(ethers.toNumber(subscriptionEndDate)).to.equal(expectedEndDate);
      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore - subscriptionParams.price);
    });

    it('should emit NewSubscription event', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 15,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);

      const subscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });
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
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NoSubscriptionParams');
    });

    it('should revert if the subscription price is not equal to value sent', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const tokenSended = ethers.parseEther('1.3'); // Send more money than required
      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
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
      await expect(subscriptionTx).to.be.revertedWithCustomError(
        protectedDataSharingContract,
        'WrongAmountSent',
      );
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore);
    });

    it('should extend lastSubscriptionExpiration when a user take a subscription ending after the previous lastSubscriptionExpiration', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 48 * 60 * 60, // 48h
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const firstSubscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber)
      ).timestamp;
      // extends lastSubscriptionExpiration
      expect(
        (await protectedDataSharingContract.collectionDetails(collectionTokenId))[1],
      ).to.be.equal(firstSubscriptionBlockTimestamp + subscriptionParams.duration);

      const secondSubscriptionTx = await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });
      const secondSubscriptionReceipt = await secondSubscriptionTx.wait();
      const secondSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(secondSubscriptionReceipt.blockNumber)
      ).timestamp;
      // extends lastSubscriptionExpiration
      expect(
        (await protectedDataSharingContract.collectionDetails(collectionTokenId))[1],
      ).to.be.equal(secondSubscriptionBlockTimestamp + subscriptionParams.duration);
    });

    it('should not extend lastSubscriptionExpiration when a user take a subscription ending before the previous lastSubscriptionExpiration', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 48 * 60 * 60, // 48h
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      const firstSubscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });
      const firstSubscriptionReceipt = await firstSubscriptionTx.wait();
      const firstSubscriptionBlockTimestamp = (
        await ethers.provider.getBlock(firstSubscriptionReceipt.blockNumber)
      ).timestamp;
      const firstSubscriptionEnd = firstSubscriptionBlockTimestamp + subscriptionParams.duration;
      // extends lastSubscriptionExpiration
      expect(
        (await protectedDataSharingContract.collectionDetails(collectionTokenId))[1],
      ).to.be.equal(firstSubscriptionEnd);

      // update subscription params for next subscribers
      const newSubscriptionParams = {
        price: subscriptionParams.price,
        duration: 24 * 60 * 60, // 24h
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, newSubscriptionParams);

      // subscribe with new subscription params
      const secondSubscriptionTx = await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });
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
        (await protectedDataSharingContract.collectionDetails(collectionTokenId))[1],
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
      const retrievedParamsArray = (
        await protectedDataSharingContract.collectionDetails(collectionTokenId)
      )[2];

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

      const subscriptionDuration = (
        await protectedDataSharingContract.collectionDetails(collectionTokenId)
      )[2][1]; // duration should be greater than 0
      expect(ethers.toNumber(subscriptionDuration)).to.greaterThan(0);
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
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NotCollectionOwner');
    });

    it('should revert if trying to set protectedData not own by the collection contract', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NoProtectedDataInCollection');
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
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'ProtectedDataForSale');
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

      const subscriptionDuration = (
        await protectedDataSharingContract.collectionDetails(collectionTokenId)
      )[2][0];
      expect(ethers.toNumber(subscriptionDuration)).to.equal(0);
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
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { protectedDataSharingContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NoProtectedDataInCollection');
    });

    it('should revert if trying to remove protectedData with ongoing subscriptions for the collection', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        collectionTokenId,
        subscriptionParams,
        addr1,
        addr2,
      } = await loadFixture(setProtectedDataToSubscription);

      await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWithCustomError(
        protectedDataSharingContract,
        'OnGoingCollectionSubscriptions',
      );
    });
  });
});
