import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetFor } from '../../scripts/singleFunction/dataset.js';
import { addProtectedDataToCollection, createCollection } from './utils/loadFixture.test.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Renting', () => {
  const priceParam = ethers.parseEther('0.5');
  const durationParam = new Date().getTime();

  describe('setProtectedDataToRenting()', () => {
    it('should set protectedData for renting', async () => {
      const { dataProtectorSharingContract, addr1, protectedDataAddress } = await loadFixture(
        addProtectedDataToCollection,
      );
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam);

      const rentingParams = (
        await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress)
      )[4];
      expect(rentingParams[1]).to.greaterThan(0);
    });

    it('should emit ProtectedDataAddedForRenting event', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataAddedForRenting')
        .withArgs(collectionTokenId, protectedDataAddress, priceParam, durationParam);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        addr2: notCollectionOwner,
        protectedDataAddress,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if the protectedData is available for sale', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, priceParam);
      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ProtectedDataForSale');
    });
  });

  describe('removeProtectedDataFromRenting()', () => {
    it('should remove protectedData from renting', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );
      await dataProtectorSharingContract
        .connect(addr1)
        .removeProtectedDataFromRenting(protectedDataAddress);

      const rentingParams = (
        await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress)
      )[4];
      expect(rentingParams[1]).to.equal(0);
    });

    it('should emit ProtectedDataRemovedFromRenting event', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataFromRenting(protectedDataAddress),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataRemovedFromRenting')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        addr2: notCollectionOwner,
        protectedDataAddress,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .removeProtectedDataFromRenting(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataFromRenting(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });
  });

  describe('rentProtectedData()', () => {
    it('should emit NewRental event', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam);

      const rentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, {
          value: priceParam,
        });
      const rentalReceipt = await rentalTx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(rentalReceipt.blockNumber)).timestamp;
      const expectedEndDate = blockTimestamp + durationParam;
      await expect(rentalReceipt)
        .to.emit(dataProtectorSharingContract, 'NewRental')
        .withArgs(collectionTokenId, protectedDataAddress, addr2.address, expectedEndDate);
    });

    it('should extends lastRentalExpiration if the rental ends after previous lastRentalExpiration', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam);

      const firstRentalTx = await dataProtectorSharingContract
        .connect(addr1)
        .rentProtectedData(protectedDataAddress, {
          value: priceParam,
        });
      const firstRentalReceipt = await firstRentalTx.wait();
      const firstRentalBlockTimestamp = (
        await ethers.provider.getBlock(firstRentalReceipt.blockNumber)
      ).timestamp;
      const firstRentalEndDate = firstRentalBlockTimestamp + durationParam;
      expect(
        (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[2],
      ).to.equal(firstRentalEndDate);

      const secondRentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, {
          value: priceParam,
        });
      const secondRentalReceipt = await secondRentalTx.wait();
      const secondRentalBlockTimestamp = (
        await ethers.provider.getBlock(secondRentalReceipt.blockNumber)
      ).timestamp;
      const secondRentalEndDate = secondRentalBlockTimestamp + durationParam;
      expect(
        (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[2],
      ).to.equal(secondRentalEndDate);
    });

    it('should not extend lastRentalExpiration if the rental ends before previous lastRentalExpiration', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);
      const rentalDuration = 48 * 60 * 60; // 48h
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, priceParam, rentalDuration);

      const firstRentalTx = await dataProtectorSharingContract
        .connect(addr1)
        .rentProtectedData(protectedDataAddress, {
          value: priceParam,
        });
      const firstRentalReceipt = await firstRentalTx.wait();
      const firstRentalBlockTimestamp = (
        await ethers.provider.getBlock(firstRentalReceipt.blockNumber)
      ).timestamp;
      const firstRentalEndDate = firstRentalBlockTimestamp + rentalDuration;
      expect(
        (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[2],
      ).to.equal(firstRentalEndDate);

      // update rental duration for next renters
      const newRentalDuration = 24 * 60 * 60; // 24h
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, priceParam, newRentalDuration);
      const secondRentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, {
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
        (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[2],
      ).to.equal(firstRentalEndDate);
    });

    it('should revert if the protectedData is not available for renting', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr2 } = await loadFixture(
        addProtectedDataToCollection,
      );

      await expect(
        dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, {
          value: priceParam,
        }),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataNotAvailableForRenting',
      );
    });

    it('should revert if the user sends the wrong amount', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, priceParam, durationParam);

      await expect(
        dataProtectorSharingContract.rentProtectedData(protectedDataAddress, {
          value: ethers.parseEther('0.2'),
        }),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'WrongAmountSent');
    });
  });
});
