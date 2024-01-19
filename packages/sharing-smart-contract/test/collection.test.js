import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Collection.sol', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // pass the registry instance to the deploy method
    const CollectionFactory = await ethers.getContractFactory('Collection');
    const collectionContract = await CollectionFactory.deploy(
      '0x799daa22654128d0c64d5b79eac9283008158730',
    );
    const deploymentTransaction = collectionContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { collectionContract, owner, addr1, addr2 };
  }

  async function createCollection() {
    const { collectionContract, addr1, addr2 } = await loadFixture(deploySCFixture);
    const tx = await collectionContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    return { collectionContract, collectionTokenId, addr1, addr2 };
  }

  describe('ERC721 Functions()', () => {
    it('Should transfer ownership of the collection', async () => {
      const { collectionContract, collectionTokenId, addr1, addr2 } =
        await loadFixture(createCollection);

      expect(await collectionContract.ownerOf(0)).to.equal(addr1.address);

      const tx1 = collectionContract
        .connect(addr1)
        .safeTransferFrom(addr1, addr2.address, collectionTokenId);
      await expect(tx1)
        .to.emit(collectionContract, 'Transfer')
        .withArgs(addr1.address, addr2.address, collectionTokenId);

      const collectionOwner = await collectionContract.ownerOf(collectionTokenId);
      expect(collectionOwner).to.equal(addr2.address);
    });
  });

  describe('CreateCollection()', () => {
    it('Should create a collection and set the owner', async () => {
      const { collectionContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await collectionContract.connect(addr1).createCollection();
      // Retrieve the collectionTokenId from the transaction receipt
      const receipt = await tx.wait();
      const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

      await expect(tx)
        .to.emit(collectionContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, addr1.address, collectionTokenId);

      // Check the owner and subscriberWhitelist of the collection
      const collectionOwner = await collectionContract.ownerOf(collectionTokenId);
      expect(collectionOwner).to.equal(addr1.address);
    });
    it('check that collectionTokenId variable have correctly be incremented', async () => {
      const { collectionContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await collectionContract.connect(addr1).createCollection();
      // Retrieve the collectionTokenId from the transaction receipt
      const receipt = await tx.wait();
      const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);

      // _nextCollectionId is stored in the SLOT_6 of the EVM SC storage
      const nextTokenId = await ethers.provider.getStorage(
        await collectionContract.getAddress(),
        6,
      );
      expect(collectionTokenId + 1).to.be.equal(ethers.toNumber(nextTokenId));
    });
  });

  describe('DeleteCollection()', () => {
    it('Should delete a collection', async () => {
      const { collectionContract, collectionTokenId, addr1 } = await loadFixture(createCollection);

      const tx1 = collectionContract.connect(addr1).removeCollection(collectionTokenId);
      await expect(tx1)
        .to.emit(collectionContract, 'Transfer')
        .withArgs(addr1.address, ethers.ZeroAddress, collectionTokenId);

      // Check that the collection has been deleted
      await expect(collectionContract.ownerOf(collectionTokenId))
        .to.be.revertedWithCustomError(collectionContract, `ERC721NonexistentToken`)
        .withArgs(collectionTokenId);
    });
  });

  describe('AddProtectedDataToCollection()', () => {
    it('Should add protectedData to a collection', async () => {
      const { collectionContract, collectionTokenId, addr1 } = await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      await registry.connect(addr1).approve(await collectionContract.getAddress(), protectedDataId);
      const tx = collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await expect(tx)
        .to.emit(collectionContract, 'AddProtectedDataToCollection')
        .withArgs(collectionTokenId, protectedDataAddress);
    });
    it("Should revert if protectedData's owner didn't approve this SC", async () => {
      const { collectionContract, collectionTokenId, addr1 } = await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const tx = collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await expect(tx).to.be.revertedWith('Collection Contract not approved');
    });
  });

  describe('RemoveProtectedDataFromCollection()', () => {
    it('Should remove protectedData from a collection', async () => {
      const { collectionContract, collectionTokenId, addr1 } = await loadFixture(createCollection);

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

      const tx = collectionContract
        .connect(addr1)
        .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress);

      await expect(tx)
        .to.emit(collectionContract, 'RemoveProtectedDataFromCollection')
        .withArgs(collectionTokenId, protectedDataAddress);
    });
    it('Should revert if protectedData is not in the collection', async () => {
      const { collectionContract, collectionTokenId, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
      const tx = collectionContract
        .connect(addr1)
        .removeProtectedDataFromCollection(collectionTokenId, protectedDataAddress);

      await expect(tx).to.be.revertedWith('ProtectedData not in collection');
    });
  });
});
