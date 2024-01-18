import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Renting.sol', () => {
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

  describe('setProtectedDataToRenting()', () => {
    it('should set protected data to renting', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
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
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);
      await protectedDataSharingContract.setProtectedDataToRenting(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(
        protectedDataSharingContract.protectedDataInRenting(
          collectionTokenId,
          protectedDataAddress,
        ),
      ).to.be.true;
    });

    it('should emit AddProtectedDataAvailableForRenting event', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
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
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await expect(
        protectedDataSharingContract.setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
        ),
      )
        .to.emit(protectedDataSharingContract, 'AddProtectedDataAvailableForRenting')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should only allow owner to set protected data to renting', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
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
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('removeProtectedDataFromRenting()', () => {
    it('should remove protected data from renting', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
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
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);
      await protectedDataSharingContract.removeProtectedDataFromRenting(
        collectionTokenId,
        protectedDataAddress,
      );

      expect(
        await protectedDataSharingContract.protectedDataInRenting(
          collectionTokenId,
          protectedDataAddress,
        ),
      ).to.be.false;
    });

    it('should emit RemoveProtectedDataAvailableForRenting event', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
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
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await protectedDataSharingContract.setProtectedDataToRenting(
        collectionTokenId,
        protectedDataAddress,
      );

      await expect(
        protectedDataSharingContract.removeProtectedDataFromRenting(
          collectionTokenId,
          protectedDataAddress,
        ),
      )
        .to.emit(protectedDataSharingContract, 'RemoveProtectedDataAvailableForRenting')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should only allow owner to remove protected data from renting', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
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
        .approve(await collectionContract.getAddress(), protectedDataTokenId);
      await collectionContract
        .connect(addr1)
        .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);

      await protectedDataSharingContract.setProtectedDataToRenting(
        collectionTokenId,
        protectedDataAddress,
      );

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
});
