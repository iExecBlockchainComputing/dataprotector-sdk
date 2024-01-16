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
});
