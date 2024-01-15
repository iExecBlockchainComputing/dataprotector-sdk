import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';

const { ethers } = pkg;

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
      const subscriptionParams = {
        price: ethers.parseEther('0.000001'),
        duration: 30,
      };
      await subscriptionContract.connect(addr1).setSubscriptionParams(tokenId, subscriptionParams);

      const subscriptionTx = await subscriptionContract
        .connect(addr1)
        .subscribeTo(tokenId, { value: subscriptionParams.price });
      const subscriptionReceipt = await subscriptionTx.wait();
      const endDate = subscriptionReceipt.logs[0].args[1];

      const subscriptionInfo = await subscriptionContract.subscriptionInfos(tokenId);

      expect(subscriptionInfo.subscriber).to.equal(addr1.address);
      expect(subscriptionInfo.endDate).to.equal(endDate);
    });

    it.only('should emit NewSubscription event', async () => {
      const { subscriptionContract, addr1 } = await loadFixture(deploySCFixture);
      const tx = await subscriptionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);

      const subscriptionPrice = ethers.parseEther('0.5');
      const tokenSended = ethers.parseEther('1.123442');
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
    it('should set and get subscription parameters', async () => {
      
    });
  });
});
