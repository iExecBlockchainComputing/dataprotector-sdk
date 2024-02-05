import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from '../config/config.js';
import { createAppForContract } from '../scripts/singleFunction/app.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Renting', () => {
  const priceOption = ethers.parseEther('0.5');
  const durationParam = new Date().getTime();

  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_APP_REGISTRY_ADDRESS,
      POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
      owner.address,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }

  async function createCollection() {
    const { protectedDataSharingContract, owner, addr1 } = await loadFixture(deploySCFixture);
    const tx = await protectedDataSharingContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    const appAddress = await createAppForContract(
      await protectedDataSharingContract.getAddress(),
      rpcURL,
    );
    return { protectedDataSharingContract, collectionTokenId, appAddress, owner, addr1 };
  }

  async function addProtectedDataToCollection() {
    const { protectedDataSharingContract, collectionTokenId, appAddress, owner, addr1 } =
      await loadFixture(createCollection);

    const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);
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
    return { protectedDataSharingContract, collectionTokenId, protectedDataAddress, owner, addr1 };
  }

  describe('setProtectedDataToRenting()', () => {
    it('should set protected data to renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract.setProtectedDataToRenting(
        collectionTokenId,
        protectedDataAddress,
        priceOption,
        durationParam,
      );

      const rentingParams = await protectedDataSharingContract.protectedDataForRenting(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(rentingParams[0]).to.equal(true);
    });

    it('should emit ProtectedDataAddedToRenting event', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract.setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceOption,
          durationParam,
        ),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataAddedForRenting')
        .withArgs(collectionTokenId, protectedDataAddress, priceOption, durationParam);
    });

    it('should only allow owner to set protected data to renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);
      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(
            collectionTokenId,
            protectedDataAddress,
            priceOption,
            durationParam,
          ),
      ).to.be.revertedWith('ProtectedData is not in collection');
    });

    it('should revert if the protected data is available for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract.setProtectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
        priceOption,
      );
      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataToRenting(
            collectionTokenId,
            protectedDataAddress,
            priceOption,
            durationParam,
          ),
      ).to.be.revertedWith('ProtectedData for sale');
    });
  });

  describe('removeProtectedDataFromRenting()', () => {
    it('should remove protected data from renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract.removeProtectedDataFromRenting(
        collectionTokenId,
        protectedDataAddress,
      );

      const rentingParams = await protectedDataSharingContract.protectedDataForRenting(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(rentingParams[0]).to.equal(false);
    });

    it('should emit ProtectedDataRemovedFromRenting event', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract.setProtectedDataToRenting(
        collectionTokenId,
        protectedDataAddress,
        priceOption,
        durationParam,
      );

      await expect(
        protectedDataSharingContract.removeProtectedDataFromRenting(
          collectionTokenId,
          protectedDataAddress,
        ),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataRemovedFromRenting')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should only allow owner to remove protected data from renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData is not in collection');
    });
  });

  describe('rentProtectedData()', () => {
    it('should be allow to rent protectedData ', async () => {
      const { protectedDataSharingContract, collectionTokenId, owner, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract.setProtectedDataToRenting(
        collectionTokenId,
        protectedDataAddress,
        priceOption,
        durationParam,
      );

      const rentalTx = await protectedDataSharingContract.rentProtectedData(
        collectionTokenId,
        protectedDataAddress,
        {
          value: priceOption,
        },
      );
      const rentalReceipt = await rentalTx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(rentalReceipt.blockNumber)).timestamp;
      const expectedEndDate = blockTimestamp + durationParam;
      await expect(rentalReceipt)
        .to.emit(protectedDataSharingContract, 'NewRental')
        .withArgs(collectionTokenId, protectedDataAddress, owner.address, expectedEndDate);
      expect(
        await protectedDataSharingContract.lastRentalExpiration(protectedDataAddress),
      ).to.equal(expectedEndDate);
    });

    it('should revert if protectedData has not set to rental', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract.rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: priceOption,
        }),
      ).to.be.revertedWith('ProtectedData not available for renting');
    });

    it('should only allow owner to remove protected data from renting', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract.setProtectedDataToRenting(
        collectionTokenId,
        protectedDataAddress,
        priceOption,
        durationParam,
      );

      await expect(
        protectedDataSharingContract.rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: ethers.parseEther('0.2'),
        }),
      ).to.be.revertedWith('Wrong amount sent');
    });
  });
});
