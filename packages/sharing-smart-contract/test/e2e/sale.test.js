import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetFor } from '../../scripts/singleFunction/dataset.js';
import { addProtectedDataToCollection, createCollection } from './utils/loadFixture.test.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Sale', () => {
  const priceParam = 1;

  describe('setProtectedDataForSale()', () => {
    it('should set the protectedData for sale', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, priceParam);

      const saleParams = (
        await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress)
      )[5];
      expect(saleParams[0]).to.equal(true);
    });

    it('should emit ProtectedDataAddedForSale event', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(protectedDataAddress, priceParam),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataAddedForSale')
        .withArgs(collectionTokenId, protectedDataAddress, priceParam);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .setProtectedDataForSale(protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });

    it('should revert if the protectedData is currently available in subscription', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToSubscription(protectedDataAddress);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataAvailableInSubscription',
      );
    });

    it('should revert if the protectedData is available for renting', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );
      const rentingParams = {
        price: 1, // in nRLC
        duration: 1_500,
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, rentingParams);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataAvailableForRenting',
      );
    });

    it('should revert if the protectedData is currently rented', async () => {
      const { dataProtectorSharingContract, pocoContract, protectedDataAddress, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      const rentingParams = {
        price: 1, // in nRLC
        duration: 1_500,
      };
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(protectedDataAddress, rentingParams);

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), rentingParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(rentingParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      // start renting
      await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(protectedDataAddress, rentingParams);

      // remove from available for renting (ongoing rental are still valid)
      await dataProtectorSharingContract
        .connect(addr1)
        .removeProtectedDataFromRenting(protectedDataAddress);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataCurrentlyBeingRented',
      );
    });
  });

  describe('removeProtectedDataForSale()', () => {
    it('should remove protectedData for sale', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1 } = await loadFixture(
        addProtectedDataToCollection,
      );
      await dataProtectorSharingContract
        .connect(addr1)
        .removeProtectedDataForSale(protectedDataAddress);

      const saleParams = (
        await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress)
      )[5];
      expect(saleParams[0]).to.equal(false);
    });

    it('should emit ProtectedDataRemovedFromSale event', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, priceParam);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataForSale(protectedDataAddress),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataRemovedFromSale')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .removeProtectedDataForSale(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, addr1 } = await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataForSale(protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ERC721NonexistentToken');
    });
  });

  describe('buyProtectedData()', () => {
    it('should transfer the protectedData to the buyer', async () => {
      const { dataProtectorSharingContract, pocoContract, protectedDataAddress, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, priceParam);
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), priceParam);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(priceParam.toString(), 'gwei'),
      }); // value sent should be in wei
      await dataProtectorSharingContract
        .connect(addr2)
        .buyProtectedData(protectedDataAddress, addr2.address, priceParam);
      const registry = await ethers.getContractAt(
        'IRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      expect(await registry.ownerOf(protectedDataTokenId)).to.equal(addr2.address);
    });

    it('should emit ProtectedDataSold event', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, priceParam);
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), priceParam);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(priceParam.toString(), 'gwei'),
      }); // value sent should be in wei

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedData(protectedDataAddress, addr2.address, priceParam),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataSold')
        .withArgs(collectionTokenId, addr2.address, protectedDataAddress);
    });

    it('should revert if the protectedData is not for sale', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr2 } = await loadFixture(
        addProtectedDataToCollection,
      );

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedData(protectedDataAddress, addr2.address, priceParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ProtectedDataNotForSale');
    });

    it('should revert if amount set is not the current protected data price', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, addr1, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(protectedDataAddress, priceParam);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedData(protectedDataAddress, addr2.address, priceParam * 2),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'InvalidPriceForPurchase');
    });
  });
});
