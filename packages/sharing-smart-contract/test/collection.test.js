/* eslint-disable no-underscore-dangle */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Collection', () => {
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

  async function createCollection() {
    const { protectedDataSharingContract, addr1, addr2 } = await loadFixture(deploySCFixture);
    const tx = await protectedDataSharingContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    return { protectedDataSharingContract, collectionTokenId, addr1, addr2 };
  }

  describe('ERC721 Functions()', () => {
    it('Should transfer ownership of the collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      expect(await protectedDataSharingContract.ownerOf(0)).to.equal(addr1.address);

      const tx1 = protectedDataSharingContract
        .connect(addr1)
        .safeTransferFrom(addr1, addr2.address, collectionTokenId);
      await expect(tx1)
        .to.emit(protectedDataSharingContract, 'Transfer')
        .withArgs(addr1.address, addr2.address, collectionTokenId);

      const collectionOwner = await protectedDataSharingContract.ownerOf(collectionTokenId);
      expect(collectionOwner).to.equal(addr2.address);
    });
  });

  describe('CreateCollection()', () => {
    it('Should create a collection and set the owner', async () => {
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
    it('check that collectionTokenId variable have correctly be incremented', async () => {
      const { protectedDataSharingContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await protectedDataSharingContract.connect(addr1).createCollection();
      // Retrieve the collectionTokenId from the transaction receipt
      const receipt = await tx.wait();
      const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

      // _nextCollectionId is stored in the SLOT_11 of the EVM SC storage
      const nextTokenId = await ethers.provider.getStorage(
        await protectedDataSharingContract.getAddress(),
        11,
      );
      expect(collectionTokenId + 1).to.be.equal(ethers.toNumber(nextTokenId));
    });
  });

  describe('DeleteCollection()', () => {
    it('Should delete a collection', async () => {
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
  });

  describe('AddProtectedDataToCollection()', () => {
    it('Should add protectedData to a collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry
        .connect(addr1)
        .approve(await protectedDataSharingContract.getAddress(), protectedDataId);
      const tx = protectedDataSharingContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await expect(tx)
        .to.emit(protectedDataSharingContract, 'AddProtectedDataToCollection')
        .withArgs(collectionTokenId, protectedDataAddress);
    });
    it("Should revert if protectedData's owner didn't approve this SC", async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const tx = protectedDataSharingContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await expect(tx).to.be.revertedWith('Collection Contract not approved');
    });
  });

  describe('RemoveProtectedDataFromCollection()', () => {
    it('Should remove protectedData from a collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
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
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      const tx = protectedDataSharingContract
        .connect(addr1)
        .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress);

      await expect(tx)
        .to.emit(protectedDataSharingContract, 'RemoveProtectedDataFromCollection')
        .withArgs(collectionTokenId, protectedDataAddress);
    });
    it('Should revert if protectedData is not in the collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const tx = protectedDataSharingContract
        .connect(addr1)
        .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress);

      await expect(tx).to.be.revertedWith('ProtectedData not in collection');
    });
  });
});
