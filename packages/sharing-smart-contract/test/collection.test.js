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

  describe('ERC721 Functions()', () => {
    it('Should transfer ownership of the collection', async () => {
      const { collectionContract, addr1, addr2 } = await loadFixture(deploySCFixture);

      const tx = await collectionContract.connect(addr1).createCollection();
      // Retrieve the tokenId from the transaction receipt
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);
      expect(await collectionContract.ownerOf(0)).to.equal(addr1.address);

      const tx1 = collectionContract.connect(addr1).safeTransferFrom(addr1, addr2.address, tokenId);
      await expect(tx1)
        .to.emit(collectionContract, 'Transfer')
        .withArgs(addr1.address, addr2.address, tokenId);

      const collectionOwner = await collectionContract.ownerOf(tokenId);
      expect(collectionOwner).to.equal(addr2.address);
    });
  });

  describe('CreateCollection()', () => {
    it('Should create a collection and set the owner', async () => {
      const { collectionContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await collectionContract.connect(addr1).createCollection();
      // Retrieve the tokenId from the transaction receipt
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);

      await expect(tx)
        .to.emit(collectionContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, addr1.address, tokenId);

      // Check the owner and subscriberWhitelist of the collection
      const collectionOwner = await collectionContract.ownerOf(tokenId);
      expect(collectionOwner).to.equal(addr1.address);
    });
    it('check that tokenId variable have correctly be incremented', async () => {
      const { collectionContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await collectionContract.connect(addr1).createCollection();
      // Retrieve the tokenId from the transaction receipt
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);

      // _nextCollectionId is stored in the SLOT_6 of the EVM SC storage
      const nextTokenId = await ethers.provider.getStorage(
        await collectionContract.getAddress(),
        6,
      );
      expect(tokenId + 1).to.be.equal(ethers.toNumber(nextTokenId));
    });
  });

  describe('DeleteCollection()', () => {
    it('Should delete a collection', async () => {
      const { collectionContract, addr1 } = await loadFixture(deploySCFixture);

      const tx = await collectionContract.connect(addr1).createCollection();
      // Retrieve the tokenId from the transaction receipt
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);

      const tx1 = collectionContract.connect(addr1).removeCollection(tokenId);
      await expect(tx1)
        .to.emit(collectionContract, 'Transfer')
        .withArgs(addr1.address, ethers.ZeroAddress, tokenId);

      // Check that the collection has been deleted
      await expect(collectionContract.ownerOf(tokenId))
        .to.be.revertedWithCustomError(collectionContract, `ERC721NonexistentToken`)
        .withArgs(tokenId);
    });
  });

  describe('AddProtectedDataToCollection()', () => {
    it('Should add protectedData to a collection', async () => {
      const { collectionContract, owner } = await loadFixture(deploySCFixture);

      await collectionContract.createCollection();
      const datasetAddress = await createDatasetForContract(owner.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const tokenId = ethers.getBigInt(datasetAddress.toLowerCase()).toString();
      await registry.approve(await collectionContract.getAddress(), tokenId);
      const tx = collectionContract.addProtectedDataToCollection(0, datasetAddress);

      await expect(tx)
        .to.emit(collectionContract, 'AddProtectedDataToCollection')
        .withArgs(0, datasetAddress);
    });
    it("Should revert if protectedData's owner didn't approve this SC", async () => {
      const { collectionContract, owner } = await loadFixture(deploySCFixture);

      await collectionContract.createCollection();
      const datasetAddress = await createDatasetForContract(owner.address, rpcURL);
      const tx = collectionContract.addProtectedDataToCollection(0, datasetAddress);

      await expect(tx).to.be.revertedWith('Collection Contract not approved');
    });
  });

  describe('RemoveProtectedDataFromCollection()', () => {
    it('Should remove protectedData from a collection', async () => {
      const { collectionContract, owner } = await loadFixture(deploySCFixture);

      await collectionContract.createCollection();
      const datasetAddress = await createDatasetForContract(owner.address, rpcURL);
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const tokenId = ethers.getBigInt(datasetAddress.toLowerCase()).toString();
      await registry.approve(await collectionContract.getAddress(), tokenId);
      await collectionContract.addProtectedDataToCollection(0, datasetAddress);

      const tx = collectionContract.removeProtectedDataFromCollection(0, datasetAddress);

      await expect(tx)
        .to.emit(collectionContract, 'RemoveProtectedDataFromCollection')
        .withArgs(0, datasetAddress);
    });
    it('Should revert if protectedData is not in the collection', async () => {
      const { collectionContract, owner } = await loadFixture(deploySCFixture);

      await collectionContract.createCollection();
      const datasetAddress = await createDatasetForContract(owner.address, rpcURL);
      const tx = collectionContract.removeProtectedDataFromCollection(0, datasetAddress);

      await expect(tx).to.be.revertedWith('ProtectedData not in collection');
    });
  });
});
