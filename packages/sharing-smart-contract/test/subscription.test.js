import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';

const { ethers } = pkg;

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

  describe('setSubscriptionParams()', () => {
    it('should set and get subscription parameters', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);
      const subscriptionParams = {
        price: ethers.parseEther('0.000001'),
        duration: 30,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(tokenId, subscriptionParams);
      const retrievedParamsArray = await protectedDataSharingContract.subscriptionParams(tokenId);

      expect(subscriptionParamsToArray(subscriptionParams)).to.deep.equal(retrievedParamsArray);
    });

    it('should emit NewSubscriptionParams event', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);
      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 15,
      };

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setSubscriptionParams(tokenId, subscriptionParams),
      )
        .to.emit(protectedDataSharingContract, 'NewSubscriptionParams')
        .withArgs(subscriptionParamsToArray(subscriptionParams));
    });
  });
});
