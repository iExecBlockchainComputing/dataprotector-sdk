import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetFor } from '../../scripts/singleFunction/dataset.js';
import { addProtectedDataToCollection, createCollection } from './utils/loadFixture.test.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Renting', () => {
  const rentingParams = {
    price: 1, // in nRLC
    duration: 1_500,
  };

  describe('setProtectedDataToRenting()', () => {
    it('should set protectedData for renting', async () => {
      const { dataProtectorSharingContract, addr1, protectedDataAddress } = await loadFixture(
        addProtectedDataToCollection,
      );
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, rentingParams);

      const rentingParamsFromEvent = (
        await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress)
      )[4];
      expect(rentingParamsFromEvent[1]).to.greaterThan(0);
    });

    it('should emit ProtectedDataAddedForRenting event', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(protectedDataAddress, rentingParams),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataAddedForRenting')
        .withArgs(collectionTokenId, protectedDataAddress, [
          rentingParams.price,
          rentingParams.duration,
        ]);
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
          .setProtectedDataToRenting(protectedDataAddress, rentingParams),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOperator');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(protectedDataAddress, rentingParams),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if the protectedData is available for sale', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, rentingParams.price);
      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(protectedDataAddress, rentingParams),
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
        .setProtectedDataToRenting(protectedDataAddress, rentingParams);

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
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOperator');
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
      const { dataProtectorSharingContract, pocoContract, protectedDataAddress, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, rentingParams);
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), rentingParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(rentingParams.price.toString(), 'gwei'),
      }); // value sent should be in wei

      const rentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, rentingParams);
      const rentalReceipt = await rentalTx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(rentalReceipt.blockNumber)).timestamp;
      const expectedEndDate = blockTimestamp + rentingParams.duration;

      await expect(rentalReceipt)
        .to.emit(dataProtectorSharingContract, 'NewRental')
        .withArgs(protectedDataAddress, addr2.address, expectedEndDate);
    });

    it('should extends lastRentalExpiration if the rental ends after previous lastRentalExpiration', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, pocoContract, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, rentingParams);

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), rentingParams.price * 2);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits((rentingParams.price * 2).toString(), 'gwei'),
      }); // value sent should be in wei
      const firstRentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, rentingParams);
      const firstRentalReceipt = await firstRentalTx.wait();
      const firstRentalBlockTimestamp = (
        await ethers.provider.getBlock(firstRentalReceipt.blockNumber)
      ).timestamp;
      const firstRentalEndDate = firstRentalBlockTimestamp + rentingParams.duration;
      expect(
        (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[2],
      ).to.equal(firstRentalEndDate);

      const secondRentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, rentingParams);
      const secondRentalReceipt = await secondRentalTx.wait();
      const secondRentalBlockTimestamp = (
        await ethers.provider.getBlock(secondRentalReceipt.blockNumber)
      ).timestamp;
      const secondRentalEndDate = secondRentalBlockTimestamp + rentingParams.duration;
      expect(
        (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[2],
      ).to.equal(secondRentalEndDate);
    });

    it('should not extend lastRentalExpiration if the rental ends before previous lastRentalExpiration', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, pocoContract, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);
      const rentalDuration = 48 * 60 * 60; // 48h
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, {
          price: rentingParams.price,
          duration: rentalDuration,
        });

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), rentingParams.price * 2);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits((rentingParams.price * 2).toString(), 'gwei'),
      }); // value sent should be in wei
      const firstRentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, {
          price: rentingParams.price,
          duration: rentalDuration,
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
        .setProtectedDataToRenting(protectedDataAddress, {
          price: rentingParams.price,
          duration: newRentalDuration,
        });
      const secondRentalTx = await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, {
          price: rentingParams.price,
          duration: newRentalDuration,
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
        dataProtectorSharingContract
          .connect(addr2)
          .rentProtectedData(protectedDataAddress, rentingParams),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataNotAvailableForRenting',
      );
    });

    it('should revert if amount set is not the current protected data price', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, rentingParams);

      await expect(
        dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, {
          price: rentingParams.price * 2,
          duration: rentingParams.duration,
        }),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'InvalidRentingParams');
    });
  });
});
