import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';
import { createAppForContract } from '../scripts/singleFunction/app.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from '../scripts/singleFunction/workerpool.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('ConsumeProtectedData', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_REGISTRY_ADDRESS,
      owner.address,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }

  async function createAssets() {
    const { protectedDataSharingContract, addr1, addr2 } = await loadFixture(deploySCFixture);

    const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
    const appAddress = await createAppForContract(
      await protectedDataSharingContract.getAddress(),
      rpcURL,
    );
    const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
    const workerpoolOrder = await createWorkerpoolOrder(iexecWorkerpoolOwner, workerpoolAddress);
    return {
      protectedDataSharingContract,
      protectedDataAddress,
      appAddress,
      workerpoolOrder,
      addr1,
      addr2,
    };
  }

  async function createCollection() {
    const {
      protectedDataSharingContract,
      protectedDataAddress,
      appAddress,
      workerpoolOrder,
      addr1,
      addr2,
    } = await loadFixture(createAssets);
    const tx = await protectedDataSharingContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

    // add protectedData to Collection
    const registry = await ethers.getContractAt(
      'IDatasetRegistry',
      '0x799daa22654128d0c64d5b79eac9283008158730',
    );
    const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
    await registry
      .connect(addr1)
      .approve(await protectedDataSharingContract.getAddress(), protectedDataTokenId);
    await protectedDataSharingContract
      .connect(addr1)
      .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, appAddress);

    // set up subscription
    const subscriptionParams = {
      price: ethers.parseEther('0.5'),
      duration: 2_592_000, // 30 days
    };
    await protectedDataSharingContract
      .connect(addr1)
      .setSubscriptionParams(collectionTokenId, subscriptionParams);
    await protectedDataSharingContract
      .connect(addr1)
      .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);

    // set up renting
    const rentingParams = {
      price: ethers.parseEther('0.7'),
      duration: 172_800, // 2 days
    };
    await protectedDataSharingContract.setProtectedDataToRenting(
      collectionTokenId,
      protectedDataAddress,
      rentingParams.price,
      rentingParams.duration,
    );
    return {
      protectedDataSharingContract,
      protectedDataAddress,
      workerpoolOrder,
      collectionTokenId,
      subscriptionParams,
      rentingParams,
      addr2,
    };
  }

  describe('ConsumeProtectedData()', () => {
    it('should create a deal on chain if an end user subscribe to the collection', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollection);

      await protectedDataSharingContract.connect(addr2).subscribeTo(collectionTokenId, {
        value: subscriptionParams.price,
      });

      const tx = await protectedDataSharingContract
        .connect(addr2)
        .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, '');
      await tx.wait();

      expect(tx)
        .to.emit(protectedDataSharingContract, 'DealId')
        .withArgs((eventArgs) => {
          const dealId = eventArgs[0];
          assert.equal(dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
        });
    });

    it('should create a deal on chain if an end user rent a protectedData inside a collection', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        rentingParams,
        addr2,
      } = await loadFixture(createCollection);

      await protectedDataSharingContract
        .connect(addr2)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: rentingParams.price,
        });

      const tx = await protectedDataSharingContract
        .connect(addr2)
        .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, '');
      await tx.wait();

      expect(tx)
        .to.emit(protectedDataSharingContract, 'DealId')
        .withArgs((eventArgs) => {
          const dealId = eventArgs[0];
          assert.equal(dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
        });
    });

    it("should revert if the user don't have available subscription or renting", async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        addr2,
      } = await loadFixture(createCollection);

      await expect(
        protectedDataSharingContract
          .connect(addr2)
          .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, ''),
      ).to.be.revertedWith('No Renting or subscription valid');
    });
  });
});
