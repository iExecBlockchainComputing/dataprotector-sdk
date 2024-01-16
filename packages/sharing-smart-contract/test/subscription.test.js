import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Subscription.sol', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // pass the registry instance to the deploy method
    const SubscriptionFactory = await ethers.getContractFactory('Subscription');
    const subscriptionContract = await SubscriptionFactory.deploy(
      '0x799daa22654128d0c64d5b79eac9283008158730',
    );
    const deploymentTransaction = subscriptionContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { subscriptionContract, owner, addr1, addr2 };
  }

  function subscriptionParamsToArray(params) {
    return [params.price, params.duration];
  }

  describe('subscribeTo()', () => {
    it('should allow a user to subscribe to a collection', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);

      const subscriptionPrice = ethers.parseEther('0.5');
      const tokenSended = ethers.parseEther('1.123');
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 15,
      };
      await subscriptionContract.connect(addr1).setSubscriptionParams(tokenId, subscriptionParams);

      const subscriptionTx = await subscriptionContract
        .connect(addr1)
        .subscribeTo(tokenId, { value: tokenSended });
      const subscriptionReceipt = await subscriptionTx.wait();

      const blockTimestamp = (await ethers.provider.getBlock(subscriptionReceipt.blockNumber))
        .timestamp;
      const expectedEndDate =
        blockTimestamp +
        subscriptionParams.duration * Math.floor(ethers.toNumber(tokenSended / subscriptionPrice));

      await expect(subscriptionTx)
        .to.emit(subscriptionContract, 'NewSubscription')
        .withArgs(addr1.address, expectedEndDate);

      const subscriptionInfo = await subscriptionContract
        .connect(addr1)
        .subscribers(tokenId, addr1.address);
      expect(ethers.toNumber(subscriptionInfo)).to.equal(expectedEndDate);
    });

    it('should revert if subscription parameters are not set', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);

      await expect(
        subscriptionContract
          .connect(addr1)
          .subscribeTo(tokenId, { value: ethers.parseEther('0.1') }),
      ).to.be.revertedWith('Subscription parameters not set');
    });

    it('should revert if the subscription price is lower than required', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);
      const subscriptionParams = {
        price: ethers.parseEther('1'),
        duration: 30,
      };
      await subscriptionContract.connect(addr1).setSubscriptionParams(tokenId, subscriptionParams);

      await expect(
        subscriptionContract
          .connect(addr1)
          .subscribeTo(tokenId, { value: ethers.parseEther('0.5') }),
      ).to.be.revertedWith('Fund sent insufficient');
    });

    it('should send back extra funds to the subscriber', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);

      const subscriptionPrice = ethers.parseEther('0.5');
      const tokenSended = ethers.parseEther('1.3'); // Send more money than required
      const extraFunds = tokenSended % subscriptionPrice;
      const subscriptionParams = {
        price: subscriptionPrice,
        duration: 15,
      };
      const SubscriptionOptionsTx = await subscriptionContract
        .connect(addr1)
        .setSubscriptionParams(tokenId, subscriptionParams);
      await SubscriptionOptionsTx.wait();

      const subscriberBalanceBefore = await ethers.provider.getBalance(addr1.address);
      const subscriptionTx = await subscriptionContract
        .connect(addr1)
        .subscribeTo(tokenId, { value: tokenSended });
      await subscriptionTx.wait();
      const subscriberBalanceAfter = await ethers.provider.getBalance(addr1.address);

      // there is no transaction fees on bellecour
      expect(subscriberBalanceAfter).to.equal(subscriberBalanceBefore - tokenSended + extraFunds);
    });
  });

  describe('setSubscriptionParams()', () => {
    it('should set and get subscription parameters', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);
      const subscriptionParams = {
        price: ethers.parseEther('0.000001'),
        duration: 30,
      };
      await subscriptionContract.connect(addr1).setSubscriptionParams(tokenId, subscriptionParams);
      const retrievedParamsArray = await subscriptionContract.subscriptionParams(tokenId);

      expect(subscriptionParamsToArray(subscriptionParams)).to.deep.equal(retrievedParamsArray);
    });

    it('should emit NewSubscriptionParams event', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);
      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 15,
      };

      await expect(
        subscriptionContract.connect(addr1).setSubscriptionParams(tokenId, subscriptionParams),
      )
        .to.emit(subscriptionContract, 'NewSubscriptionParams')
        .withArgs(subscriptionParamsToArray(subscriptionParams));
    });
  });

  describe('setProtectedDataToSubscription()', () => {
    it('should set protected data to subscription', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry
        .connect(addr1)
        .approve(await subscriptionContract.getAddress(), protectedDataTokenId);
      await subscriptionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);
      await subscriptionContract
        .connect(addr1)
        .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);

      const contentInfo = await subscriptionContract.protectedDataInSubscription(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(contentInfo).to.equal(true);
    });

    it('should revert if trying to set protectedData not own by the collection', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);

      await expect(
        subscriptionContract
          .connect(addr1)
          .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith("Collection doesn't own ProtectedData");
    });
  });
});
