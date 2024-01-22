import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Subscription.sol', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_REGISTRY_ADDRESS,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    const CollectionFactory = await ethers.getContractFactory('Collection');
    const collectionContract = await CollectionFactory.attach(
      await protectedDataSharingContract.m_collection(),
    );

    return { protectedDataSharingContract, collectionContract, owner, addr1, addr2 };
  }

  function subscriptionParamsToArray(params) {
    return [params.price, params.duration];
  }

  async function createCollection() {
    const { protectedDataSharingContract, collectionContract, addr1, addr2 } =
      await loadFixture(deploySCFixture);
    const tx = await collectionContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    return { protectedDataSharingContract, collectionContract, collectionTokenId, addr1, addr2 };
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
        .withArgs(addr1.address, expectedEndDate);
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
        .withArgs(subscriptionParamsToArray(subscriptionParams));
    });
  });

  describe('setProtectedDataToSubscription()', () => {
    it('should set protected data to subscription', async () => {
      const { protectedDataSharingContract, collectionContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry
        .connect(addr1)
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);
      const setProtectedDataToSubscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);
      const setProtectedDataToSubscriptionReceipt = await setProtectedDataToSubscriptionTx.wait();

      expect(setProtectedDataToSubscriptionReceipt)
        .to.emit(protectedDataSharingContract, 'AddProtectedDataForSubscription')
        .withArgs([collectionTokenId, protectedDataAddress]);

      const contentInfo = await protectedDataSharingContract.protectedDataInSubscription(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(contentInfo).to.equal(true);
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
  });

  describe('removeProtectedDataFromSubscription()', () => {
    it('should remove protected data from subscription', async () => {
      const { protectedDataSharingContract, collectionContract, addr1, collectionTokenId } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry
        .connect(addr1)
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);
      const removeProtectedDataToSubscriptionTx = await protectedDataSharingContract
        .connect(addr1)
        .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress);
      const removeProtectedDataToSubscriptionReceipt =
        await removeProtectedDataToSubscriptionTx.wait();

      expect(removeProtectedDataToSubscriptionReceipt)
        .to.emit(protectedDataSharingContract, 'RemoveProtectedDataFromSubscription')
        .withArgs([collectionTokenId, protectedDataAddress]);

      const contentInfo = await protectedDataSharingContract.protectedDataInSubscription(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(contentInfo).to.equal(false);
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

    it('should revert if trying to remove protectedData not own by the collection contract', async () => {
      const { protectedDataSharingContract, collectionContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);
      const subscriptionPrice = ethers.parseEther('0.5');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 15,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry
        .connect(addr1)
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);
      await protectedDataSharingContract
        .connect(addr2)
        .subscribeTo(collectionTokenId, { value: subscriptionPrice });

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('Collection subscribed');
    });
  });
});
