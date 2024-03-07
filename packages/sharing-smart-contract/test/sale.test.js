import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createDatasetFor } from '../scripts/singleFunction/dataset.js';
import {
  addProtectedDataToCollection,
  createCollection,
  setProtectedDataForSale,
} from './utils/loadFixture.test.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Sale', () => {
  const priceParam = ethers.parseEther('0.5');

  describe('setProtectedDataForSale()', () => {
    it('should set the protectedData for sale', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam);

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
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataAddedForSale')
        .withArgs(collectionTokenId, protectedDataAddress, priceParam);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoProtectedDataInCollection');
    });

    it('should revert if the protectedData is currently available in subscription', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataAvailableInSubscription',
      );
    });

    it('should revert if the protectedData is available for renting', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      const durationOption = new Date().getTime();
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationOption,
        );

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataAvailableForRenting',
      );
    });

    it('should revert if the protectedData is currently rented', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);
      const durationOption = 48 * 60 * 60; // 48h
      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceParam,
          durationOption,
        );

      // start renting
      await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceParam,
        });

      // remove from available for renting (ongoing rental are still valid)
      await dataProtectorSharingContract
        .connect(addr1)
        .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam),
      ).to.be.revertedWithCustomError(
        dataProtectorSharingContract,
        'ProtectedDataCurrentlyBeingRented',
      );
    });
  });

  describe('removeProtectedDataForSale()', () => {
    it('should remove protectedData for sale', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      await dataProtectorSharingContract
        .connect(addr1)
        .removeProtectedDataForSale(collectionTokenId, protectedDataAddress);

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
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataForSale(collectionTokenId, protectedDataAddress),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataRemovedFromSale')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should revert if the user does not own the collection', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr2: notCollectionOwner,
      } = await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(notCollectionOwner)
          .removeProtectedDataForSale(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });

    it('should revert if the protectedData is not in the collection', async () => {
      const { dataProtectorSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetFor(addr1.address, rpcURL);

      await expect(
        dataProtectorSharingContract
          .connect(addr1)
          .removeProtectedDataForSale(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoProtectedDataInCollection');
    });
  });

  describe('buyProtectedDataForCollection()', () => {
    it("should transfer the protectedData to the buyer's target collection", async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenIdFrom,
        collectionTokenIdTo,
        protectedDataAddress,
        appWhitelistContractAddress,
        addr2,
      } = await loadFixture(setProtectedDataForSale);

      await dataProtectorSharingContract
        .connect(addr2)
        .buyProtectedDataForCollection(
          collectionTokenIdFrom,
          protectedDataAddress,
          collectionTokenIdTo,
          appWhitelistContractAddress,
          {
            value: priceParam,
          },
        );

      expect(
        ethers.toNumber(
          (await dataProtectorSharingContract.protectedDataDetails(protectedDataAddress))[0],
        ),
      ).to.equal(collectionTokenIdTo);
    });

    it('should emit ProtectedDataSold event', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenIdFrom,
        collectionTokenIdTo,
        protectedDataAddress,
        appWhitelistContractAddress,
        addr2,
      } = await loadFixture(setProtectedDataForSale);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedDataForCollection(
            collectionTokenIdFrom,
            protectedDataAddress,
            collectionTokenIdTo,
            appWhitelistContractAddress,
            {
              value: priceParam,
            },
          ),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataSold')
        .withArgs(
          collectionTokenIdFrom,
          await dataProtectorSharingContract.getAddress(),
          protectedDataAddress,
        );
    });

    it('should revert if protectedData is not for sale', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId: collectionTokenIdFrom,
        protectedDataAddress,
        appWhitelistContractAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      // Create a recipient collection
      const tx = await dataProtectorSharingContract.connect(addr1).createCollection(addr1.address);
      const receipt = await tx.wait();
      const collectionTokenIdTo = ethers.toNumber(receipt.logs[0].args[2]);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedDataForCollection(
            collectionTokenIdFrom,
            protectedDataAddress,
            collectionTokenIdTo,
            appWhitelistContractAddress,
            {
              value: priceParam,
            },
          ),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ProtectedDataNotForSale');
    });

    it('should revert if the wrong amount is sent', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenIdFrom,
        collectionTokenIdTo,
        protectedDataAddress,
        appWhitelistContractAddress,
        addr2,
      } = await loadFixture(setProtectedDataForSale);

      await expect(
        dataProtectorSharingContract.connect(addr2).buyProtectedDataForCollection(
          collectionTokenIdFrom,
          protectedDataAddress,
          collectionTokenIdTo,
          appWhitelistContractAddress,
          { value: ethers.parseEther('0.8') }, // Sending the wrong amount
        ),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'WrongAmountSent');
    });

    it('should revert if the user does not own the target collection', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        protectedDataAddress,
        appWhitelistContractAddress,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam);

      const tx = await dataProtectorSharingContract.connect(addr3).createCollection(addr3.address);
      const receipt = await tx.wait();
      const collectionTokenIdTo = ethers.toNumber(receipt.logs[0].args[2]);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedDataForCollection(
            collectionTokenId,
            protectedDataAddress,
            collectionTokenIdTo,
            appWhitelistContractAddress,
            {
              value: priceParam,
            },
          ),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NotCollectionOwner');
    });
  });

  describe('buyProtectedData()', () => {
    it('should transfer the protectedData to the buyer', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam);

      await dataProtectorSharingContract
        .connect(addr2)
        .buyProtectedData(collectionTokenId, protectedDataAddress, addr2.address, {
          value: priceParam,
        });
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
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedData(collectionTokenId, protectedDataAddress, addr2.address, {
            value: priceParam,
          }),
      )
        .to.emit(dataProtectorSharingContract, 'ProtectedDataSold')
        .withArgs(collectionTokenId, addr2.address, protectedDataAddress);
    });

    it('should revert if the protectedData is not for sale', async () => {
      const { dataProtectorSharingContract, collectionTokenId, protectedDataAddress, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .buyProtectedData(collectionTokenId, protectedDataAddress, addr2.address, {
            value: priceParam,
          }),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'ProtectedDataNotForSale');
    });

    it('should revert if the wrong amount is sent', async () => {
      const {
        dataProtectorSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      await dataProtectorSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceParam);

      await expect(
        dataProtectorSharingContract.connect(addr2).buyProtectedData(
          collectionTokenId,
          protectedDataAddress,
          addr2.address,
          { value: ethers.parseEther('0.8') }, // Sending the wrong amount
        ),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'WrongAmountSent');
    });
  });
});
