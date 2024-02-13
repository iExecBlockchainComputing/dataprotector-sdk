/* eslint-disable no-underscore-dangle */
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

describe('Collection', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');

    const protectedDataSharingContract = await upgrades.deployProxy(
      ProtectedDataSharingFactory,
      [
        POCO_PROXY_ADDRESS,
        POCO_APP_REGISTRY_ADDRESS,
        POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
        owner.address,
      ],
      { kind: 'transparent' },
    );
    await protectedDataSharingContract.waitForDeployment();

    return { protectedDataSharingContract, owner, addr1, addr2 };
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
    const tx = await protectedDataSharingContract
      .connect(addr1)
      .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, appAddress);
    return {
      protectedDataSharingContract,
      collectionTokenId,
      protectedDataAddress,
      appAddress,
      addr1,
      addr2,
      tx,
    };
  }

  describe('ERC721 Functions', () => {
    describe('safeTransferFrom()', () => {
      it('should transfer ownership of the collection', async () => {
        const { protectedDataSharingContract, collectionTokenId, addr1, addr2 } =
          await loadFixture(createCollection);

        expect(await protectedDataSharingContract.ownerOf(0)).to.equal(addr1.address);

        const tx = protectedDataSharingContract
          .connect(addr1)
          .safeTransferFrom(addr1, addr2.address, collectionTokenId);
        await expect(tx)
          .to.emit(protectedDataSharingContract, 'Transfer')
          .withArgs(addr1.address, addr2.address, collectionTokenId);

        const collectionOwner = await protectedDataSharingContract.ownerOf(collectionTokenId);
        expect(collectionOwner).to.equal(addr2.address);
      });
    });
  });

  describe('createCollection()', () => {
    it('should create a collection and set the owner', async () => {
      const { protectedDataSharingContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await protectedDataSharingContract.connect(addr1).createCollection();
      // Retrieve the collectionTokenId from the transaction receipt
      const receipt = await tx.wait();
      const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

      await expect(tx)
        .to.emit(protectedDataSharingContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, addr1.address, collectionTokenId);

      // Check the owner and subscriberWhitelist of the collection
      const collectionOwner = await protectedDataSharingContract.ownerOf(collectionTokenId);
      expect(collectionOwner).to.equal(addr1.address);
    });
    it('should increment the next collection tokenId', async () => {
      const { protectedDataSharingContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await protectedDataSharingContract.connect(addr1).createCollection();
      // Retrieve the collectionTokenId from the transaction receipt
      const receipt = await tx.wait();
      const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

      // _nextCollectionTokenId is stored in the SLOT_5 of the EVM SC storage
      const nextTokenId = await ethers.provider.getStorage(
        await protectedDataSharingContract.getAddress(),
        5,
      );
      expect(collectionTokenId + 1).to.be.equal(ethers.toNumber(nextTokenId));
    });
  });

  describe('removeCollection()', () => {
    it('should delete a collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const tx1 = protectedDataSharingContract.connect(addr1).removeCollection(collectionTokenId);
      await expect(tx1)
        .to.emit(protectedDataSharingContract, 'Transfer')
        .withArgs(addr1.address, ethers.ZeroAddress, collectionTokenId);

      // Check that the collection has been deleted
      await expect(protectedDataSharingContract.ownerOf(collectionTokenId))
        .to.be.revertedWithCustomError(protectedDataSharingContract, `ERC721NonexistentToken`)
        .withArgs(collectionTokenId);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        addr2: notCollectionOwner,
      } = await loadFixture(createCollection);
      await expect(
        protectedDataSharingContract
          .connect(notCollectionOwner)
          .removeCollection(collectionTokenId),
      ).to.be.revertedWith("Not the collection's owner");
    });
    it('should revert if the collection is not empty', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract
          .connect(notCollectionOwner)
          .removeCollection(collectionTokenId),
      ).to.be.revertedWith("Not the collection's owner");
    });
  });

  describe('addProtectedDataToCollection()', () => {
    it('should add protectedData to a collection', async () => {
      const {
        protectedDataSharingContract,
        protectedDataAddress,
        collectionTokenId,
        appAddress,
        tx,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(tx)
        .to.emit(protectedDataSharingContract, 'ProtectedDataAddedToCollection')
        .withArgs(collectionTokenId, protectedDataAddress, appAddress);
    });
    it('should revert if the user is not the collection owner', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        appAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(notCollectionOwner.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry
        .connect(notCollectionOwner)
        .approve(await protectedDataSharingContract.getAddress(), protectedDataId);
      await expect(
        protectedDataSharingContract
          .connect(notCollectionOwner)
          .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, appAddress),
      ).to.be.revertedWith("Not the collection's owner");
    });
    it("should revert if protectedData's owner didn't approve the ProtectedDataSharing contract", async () => {
      const { protectedDataSharingContract, collectionTokenId, appAddress, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
      const tx = protectedDataSharingContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, appAddress);

      await expect(tx).to.be.revertedWith('ProtectedDataSharing Contract not approved');
    });
    it('should revert if app address is not own by the ProtectedDataSharing contract', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
      const appAddress = await createAppFor(addr1.address, rpcURL);
      const tx = protectedDataSharingContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, appAddress);

      await expect(tx).to.be.revertedWith('App owner is not ProtectedDataSharing contract');
    });
  });

  describe('removeProtectedDataFromCollection()', () => {
    it('should remove protectedData from a collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      const tx = protectedDataSharingContract
        .connect(addr1)
        .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress);

      await expect(tx)
        .to.emit(protectedDataSharingContract, 'ProtectedDataRemovedFromCollection')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should revert if the user does not own the collection', async () => {
      const { protectedDataSharingContract, protectedDataAddress, collectionTokenId, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      const tx = protectedDataSharingContract
        .connect(addr2)
        .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress);

      await expect(tx).to.be.revertedWith("Not the collection's owner");
    });

    it('should revert if protectedData is not in the collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
      const tx = protectedDataSharingContract
        .connect(addr1)
        .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress);

      await expect(tx).to.be.revertedWith('ProtectedData not in collection');
    });

    it('should revert if protectedData is rented', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      const priceParam = ethers.parseEther('0.5');
      const durationParam = 1_500;
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationParam,
        );
      await protectedDataSharingContract
        .connect(addr1)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceParam,
        });

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData is currently being rented');
    });

    it('should revert if protectedData is in subscription and collection has ongoing subscriptions', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      const subscriptionParams = {
        price: ethers.parseEther('0.5'),
        duration: 15,
      };
      await protectedDataSharingContract
        .connect(addr1)
        .setSubscriptionParams(collectionTokenId, subscriptionParams);
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);
      await protectedDataSharingContract
        .connect(addr1)
        .subscribeTo(collectionTokenId, { value: subscriptionParams.price });

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('Collection has ongoing subscriptions');
    });
  });
});
