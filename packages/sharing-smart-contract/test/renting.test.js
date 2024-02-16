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

describe('Renting', () => {
  const priceParam = ethers.parseEther('0.5');
  const durationParam = new Date().getTime();

  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await upgrades.deployProxy(
      ProtectedDataSharingFactory,
      [owner.address],
      {
        kind: 'transparent',
        constructorArgs: [
          POCO_PROXY_ADDRESS,
          POCO_APP_REGISTRY_ADDRESS,
          POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
        ],
      },
    );
    await protectedDataSharingContract.waitForDeployment();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }

  async function createCollection() {
    const { protectedDataSharingContract, owner, addr1, addr2 } =
      await loadFixture(deploySCFixture);
    const tx = await protectedDataSharingContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    const appAddress = await createAppFor(await protectedDataSharingContract.getAddress(), rpcURL);
    return { protectedDataSharingContract, collectionTokenId, appAddress, owner, addr1, addr2 };
  }

  async function addProtectedDataToCollection() {
    const { protectedDataSharingContract, collectionTokenId, appAddress, owner, addr1, addr2 } =
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
    await protectedDataSharingContract
      .connect(addr1)
      .addProtectedDataToCollection(collectionTokenId, protectedDataAddress, appAddress);
    return {
      protectedDataSharingContract,
      collectionTokenId,
      protectedDataAddress,
      owner,
      addr1,
      addr2,
    };
  }

  describe('setProtectedDataToRenting()', () => {
    it('should set protectedData for renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationParam,
        );

      const rentingParams = await protectedDataSharingContract.protectedDataForRenting(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(rentingParams[0]).to.greaterThan(0);
    });

    it('should emit ProtectedDataAddedForRenting event', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(
            collectionTokenId,
            protectedDataAddress,
            priceParam,
            durationParam,
          ),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataAddedForRenting')
        .withArgs(collectionTokenId, protectedDataAddress, priceParam, durationParam);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        protectedDataSharingContract,
        addr2: notCollectionOwner,
        collectionTokenId,
        protectedDataAddress,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract
          .connect(notCollectionOwner)
          .setProtectedDataToRenting(
            collectionTokenId,
            protectedDataAddress,
            priceParam,
            durationParam,
          ),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(
            collectionTokenId,
            protectedDataAddress,
            priceParam,
            durationParam,
          ),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NoProtectedDataInCollection');
    });

    it('should revert if the protectedData is available for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam);
      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(
            collectionTokenId,
            protectedDataAddress,
            priceParam,
            durationParam,
          ),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'ProtectedDataForSale');
    });
  });

  describe('removeProtectedDataFromRenting()', () => {
    it('should remove protectedData from renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract
        .connect(addr1)
        .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress);

      const rentingParams = await protectedDataSharingContract.protectedDataForRenting(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(rentingParams[0]).to.equal(0);
    });

    it('should emit ProtectedDataRemovedFromRenting event', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationParam,
        );

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataRemovedFromRenting')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        protectedDataSharingContract,
        addr2: notCollectionOwner,
        collectionTokenId,
        protectedDataAddress,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract
          .connect(notCollectionOwner)
          .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'NoProtectedDataInCollection');
    });
  });

  describe('rentProtectedData()', () => {
    it('should emit NewRental event', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationParam,
        );

      const rentalTx = await protectedDataSharingContract
        .connect(addr2)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceParam,
        });
      const rentalReceipt = await rentalTx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(rentalReceipt.blockNumber)).timestamp;
      const expectedEndDate = blockTimestamp + durationParam;
      await expect(rentalReceipt)
        .to.emit(protectedDataSharingContract, 'NewRental')
        .withArgs(collectionTokenId, protectedDataAddress, addr2.address, expectedEndDate);
    });

    it('should extends lastRentalExpiration if the rental ends after previous lastRentalExpiration', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationParam,
        );

      const firstRentalTx = await protectedDataSharingContract
        .connect(addr1)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceParam,
        });
      const firstRentalReceipt = await firstRentalTx.wait();
      const firstRentalBlockTimestamp = (
        await ethers.provider.getBlock(firstRentalReceipt.blockNumber)
      ).timestamp;
      const firstRentalEndDate = firstRentalBlockTimestamp + durationParam;
      expect(
        await protectedDataSharingContract.lastRentalExpiration(protectedDataAddress),
      ).to.equal(firstRentalEndDate);

      const secondRentalTx = await protectedDataSharingContract
        .connect(addr2)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceParam,
        });
      const secondRentalReceipt = await secondRentalTx.wait();
      const secondRentalBlockTimestamp = (
        await ethers.provider.getBlock(secondRentalReceipt.blockNumber)
      ).timestamp;
      const secondRentalEndDate = secondRentalBlockTimestamp + durationParam;
      expect(
        await protectedDataSharingContract.lastRentalExpiration(protectedDataAddress),
      ).to.equal(secondRentalEndDate);
    });

    it('should not extend lastRentalExpiration if the rental ends before previous lastRentalExpiration', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);
      const rentalDuration = 48 * 60 * 60; // 48h
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          rentalDuration,
        );

      const firstRentalTx = await protectedDataSharingContract
        .connect(addr1)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceParam,
        });
      const firstRentalReceipt = await firstRentalTx.wait();
      const firstRentalBlockTimestamp = (
        await ethers.provider.getBlock(firstRentalReceipt.blockNumber)
      ).timestamp;
      const firstRentalEndDate = firstRentalBlockTimestamp + rentalDuration;
      expect(
        await protectedDataSharingContract.lastRentalExpiration(protectedDataAddress),
      ).to.equal(firstRentalEndDate);

      // update rental duration for next renters
      const newRentalDuration = 24 * 60 * 60; // 24h
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          newRentalDuration,
        );
      const secondRentalTx = await protectedDataSharingContract
        .connect(addr2)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceParam,
        });
      const secondRentalReceipt = await secondRentalTx.wait();
      const secondRentalBlockTimestamp = (
        await ethers.provider.getBlock(secondRentalReceipt.blockNumber)
      ).timestamp;
      const secondRentalEndDate = secondRentalBlockTimestamp + newRentalDuration;

      // secondRental ends before firstRental
      expect(firstRentalEndDate).to.be.greaterThan(secondRentalEndDate);

      expect(
        await protectedDataSharingContract.lastRentalExpiration(protectedDataAddress),
      ).to.equal(firstRentalEndDate);
    });

    it('should revert if the protectedData is not available for renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract
          .connect(addr2)
          .rentProtectedData(collectionTokenId, protectedDataAddress, {
            value: priceParam,
          }),
      ).to.be.revertedWithCustomError(
        protectedDataSharingContract,
        'ProtectedDataNotAvailableForRenting',
      );
    });

    it('should revert if the user sends the wrong amount', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationParam,
        );

      await expect(
        protectedDataSharingContract.rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: ethers.parseEther('0.2'),
        }),
      ).to.be.revertedWithCustomError(protectedDataSharingContract, 'WrongAmountSent');
    });
  });
});
