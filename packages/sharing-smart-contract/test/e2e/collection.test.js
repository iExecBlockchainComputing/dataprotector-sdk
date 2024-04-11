/* eslint-disable no-underscore-dangle */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetFor } from '../../scripts/singleFunction/dataset.js';
import { addProtectedDataToCollection, createCollection, deploySCFixture } from './utils/loadFixture.test.js';
import { getEventFromLogs } from './utils/utils.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Collection', () => {
  describe('ERC721:safeTransferFrom()', () => {
    it('should transfer ownership of the collection', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1, addr2 } = await loadFixture(createCollection);

      expect(await dataProtectorSharingContract.ownerOf(collectionTokenId)).to.equal(addr1.address);

      const tx = dataProtectorSharingContract.connect(addr1).safeTransferFrom(addr1, addr2.address, collectionTokenId);
      await expect(tx)
        .to.emit(dataProtectorSharingContract, 'Transfer')
        .withArgs(addr1.address, addr2.address, collectionTokenId);

      const collectionOwner = await dataProtectorSharingContract.ownerOf(collectionTokenId);
      expect(collectionOwner).to.equal(addr2.address);
    });
  });

  describe('createCollection()', () => {
    it('should create a collection and set the owner', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await dataProtectorSharingContract.createCollection(addr1.address);
      // Retrieve the collectionTokenId from the transaction receipt
      const receipt = await tx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', receipt.logs, {
        strict: true,
      });
      const collectionTokenId = ethers.toNumber(specificEventForPreviousTx.args?.tokenId);

      await expect(tx)
        .to.emit(dataProtectorSharingContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, addr1.address, collectionTokenId);

      // Check the owner and subscriberWhitelist of the collection
      const collectionOwner = await dataProtectorSharingContract.ownerOf(collectionTokenId);
      expect(collectionOwner).to.equal(addr1.address);
    });

    it('should mint the first tokenId greater than 0', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(deploySCFixture);

      // _nextCollectionTokenId is stored in the SLOT_2 of the EVM SC storage
      const nextTokenId = await ethers.provider.getStorage(await dataProtectorSharingContract.getAddress(), 2);
      expect(ethers.toNumber(nextTokenId)).to.be.equal(0);

      const tx = await dataProtectorSharingContract.createCollection(addr1.address);
      // Retrieve the collectionTokenId from the transaction receipt
      const receipt = await tx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', receipt.logs, {
        strict: true,
      });
      const collectionTokenId = ethers.toNumber(specificEventForPreviousTx.args?.tokenId);

      expect(collectionTokenId).to.be.equal(1);
    });
  });

  describe('burn()', () => {
    it('should delete a collection', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1 } = await loadFixture(createCollection);

      const tx1 = dataProtectorSharingContract.connect(addr1).burn(collectionTokenId);
      await expect(tx1)
        .to.emit(dataProtectorSharingContract, 'Transfer')
        .withArgs(addr1.address, ethers.ZeroAddress, collectionTokenId);

      // Check that the collection has been deleted
      await expect(dataProtectorSharingContract.ownerOf(collectionTokenId))
        .to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken')
        .withArgs(collectionTokenId);
    });

    it('should revert if a collection have available subscription', async () => {
      const { dataProtectorSharingContract, pocoContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      const subscriptionParams = {
        price: 1, // en nRLC
        duration: 1_500,
      };
      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      await expect(dataProtectorSharingContract.connect(addr1).burn(collectionTokenId)).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'OnGoingCollectionSubscriptions',
      );
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        addr2: notCollectionOwner,
      } = await loadFixture(createCollection);
      await expect(
        dataProtectorSharingContract.connect(notCollectionOwner).burn(collectionTokenId),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721InsufficientApproval');
    });

    it('should revert if the collection is not empty', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(dataProtectorSharingContract.connect(addr1).burn(collectionTokenId)).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'CollectionNotEmpty',
      );
    });
  });

  describe('addProtectedDataToCollection()', () => {
    it('should add protectedData to a collection', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, collectionTokenId, addOnlyAppWhitelistContractAddress, tx } =
        await loadFixture(addProtectedDataToCollection);

      await expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataTransfer')
        .withArgs(protectedDataAddress, collectionTokenId, 0, addOnlyAppWhitelistContractAddress);
    });

    it('should revert if the user is not the collection owner', async () => {
      const {
        dataProtectorSharingContract,
        addOnlyAppWhitelistRegistryContract,
        collectionTokenId,
        addr2: notCollectionOwner,
      } = await loadFixture(createCollection);

      const newAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(notCollectionOwner.address);
      const transactionReceipt = await newAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistContractAddress = ethers.getAddress(ethers.toBeHex(specificEventForPreviousTx.args?.tokenId));
      const protectedDataAddress = await createDatasetFor(notCollectionOwner.address, rpcURL);
      const registry = await ethers.getContractAt('IRegistry', '0x799daa22654128d0c64d5b79eac9283008158730');
      const protectedDataId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry
        .connect(notCollectionOwner)
        .approve(await dataProtectorSharingContract.getAddress(), protectedDataId);
      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, addOnlyAppWhitelistContractAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOperator');
    });

    it("should revert if protectedData's owner didn't approve the ProtectedDataSharing contract", async () => {
      const { dataProtectorSharingContract, addOnlyAppWhitelistRegistryContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const newAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(addr1.address);
      const transactionReceipt = await newAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistContractAddress = ethers.getAddress(ethers.toBeHex(specificEventForPreviousTx.args?.tokenId));

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
      const tx = dataProtectorSharingContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, addOnlyAppWhitelistContractAddress);

      // this revert error come from the DatasetRegistry
      await expect(tx).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
    });
    
    it('should revert if addOnlyAppWhitelist Contract is not registered in the addOnlyAppWhitelistRegistry', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1 } = await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
      const tx = dataProtectorSharingContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, ethers.ZeroAddress);

      await expect(tx).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });
  });

  describe('removeProtectedDataFromCollection()', () => {
    it('should remove protectedData from a collection', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      const tx = dataProtectorSharingContract.connect(addr1).removeProtectedDataFromCollection(protectedDataAddress);

      await expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataTransfer')
        .withArgs(protectedDataAddress, 0, collectionTokenId, ethers.ZeroAddress);
    });

    it('should revert if the user does not own the collection', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      const tx = dataProtectorSharingContract.connect(addr2).removeProtectedDataFromCollection(protectedDataAddress);

      await expect(tx).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOperator');
    });

    it('should revert if protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);
      const tx = dataProtectorSharingContract.connect(addr1).removeProtectedDataFromCollection(protectedDataAddress);

      await expect(tx).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if protectedData is rented', async () => {
      const { dataProtectorSharingContract, pocoContract, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      const rentingParams = {
        price: 1, // in nRLC
        duration: 1_500,
      };
      await dataProtectorSharingContract.connect(addr1).setProtectedDataToRenting(protectedDataAddress, rentingParams);
      await pocoContract.approve(await dataProtectorSharingContract.getAddress(), rentingParams.price);
      await pocoContract.deposit({
        value: ethers.parseUnits(rentingParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      await dataProtectorSharingContract.rentProtectedData(protectedDataAddress, rentingParams);

      await expect(
        dataProtectorSharingContract.connect(addr1).removeProtectedDataFromCollection(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ProtectedDataCurrentlyBeingRented');
    });

    it('should revert if protectedData is in subscription and collection has ongoing subscriptions', async () => {
      const { dataProtectorSharingContract, pocoContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      const subscriptionParams = {
        price: 1,
        duration: 15,
      };
      await dataProtectorSharingContract.connect(addr1).setSubscriptionParams(collectionTokenId, subscriptionParams);
      await dataProtectorSharingContract.connect(addr1).setProtectedDataToSubscription(protectedDataAddress);
      await pocoContract.approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      await dataProtectorSharingContract.subscribeToCollection(collectionTokenId, subscriptionParams);

      await expect(
        dataProtectorSharingContract.connect(addr1).removeProtectedDataFromCollection(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'OnGoingCollectionSubscriptions');
    });
  });
});
