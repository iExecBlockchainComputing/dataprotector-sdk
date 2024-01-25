import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Sale', () => {
  const priceOption = ethers.parseEther('0.5');

  async function deploySCFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_REGISTRY_ADDRESS,
      owner.address,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { protectedDataSharingContract, owner, addr1, addr2, addr3 };
  }

  async function createOneCollection() {
    const { protectedDataSharingContract, addr1, addr2, addr3 } =
      await loadFixture(deploySCFixture);
    const tx = await protectedDataSharingContract.connect(addr1).createCollection();
    const receipt = await tx.wait();
    const collectionTokenId = ethers.toNumber(receipt.logs[0].args[2]);
    return {
      protectedDataSharingContract,
      collectionTokenId,
      addr1,
      addr2,
      addr3,
    };
  }

  async function createTwoCollection() {
    const { protectedDataSharingContract, addr1, addr2 } = await loadFixture(deploySCFixture);
    const tx1 = await protectedDataSharingContract.connect(addr1).createCollection();
    const receipt1 = await tx1.wait();
    const collectionTokenIdFrom = ethers.toNumber(receipt1.logs[0].args[2]);
    const tx2 = await protectedDataSharingContract.connect(addr2).createCollection();
    const receipt2 = await tx2.wait();
    const collectionTokenIdTo = ethers.toNumber(receipt2.logs[0].args[2]);
    return {
      protectedDataSharingContract,
      collectionTokenIdFrom,
      collectionTokenIdTo,
      addr1,
      addr2,
    };
  }

  async function createAndAddProtectedDataToCollection(
    protectedDataSharingContract,
    collectionTokenId,
    addr,
  ) {
    const protectedDataAddress = await createDatasetForContract(addr.address, rpcURL);
    const registry = await ethers.getContractAt(
      'IDatasetRegistry',
      '0x799daa22654128d0c64d5b79eac9283008158730',
    );
    const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
    await registry
      .connect(addr)
      .approve(await protectedDataSharingContract.getAddress(), protectedDataTokenId);
    await protectedDataSharingContract
      .connect(addr)
      .addProtectedDataToCollection(collectionTokenId, protectedDataAddress);
    return { protectedDataAddress };
  }

  async function addProtectedDataToCollection() {
    const { protectedDataSharingContract, collectionTokenId, addr1, addr2, addr3 } =
      await loadFixture(createOneCollection);

    const { protectedDataAddress } = await createAndAddProtectedDataToCollection(
      protectedDataSharingContract,
      collectionTokenId,
      addr1,
    );
    return {
      protectedDataSharingContract,
      collectionTokenId,
      protectedDataAddress,
      addr1,
      addr2,
      addr3,
    };
  }

  async function setProtectedDataForSale() {
    const {
      protectedDataSharingContract,
      collectionTokenIdFrom,
      collectionTokenIdTo,
      addr1,
      addr2,
    } = await loadFixture(createTwoCollection);

    const { protectedDataAddress } = await createAndAddProtectedDataToCollection(
      protectedDataSharingContract,
      collectionTokenIdFrom,
      addr1,
    );

    await protectedDataSharingContract
      .connect(addr1)
      .setProtectedDataForSale(collectionTokenIdFrom, protectedDataAddress, priceOption);

    return {
      protectedDataSharingContract,
      collectionTokenIdFrom,
      collectionTokenIdTo,
      protectedDataAddress,
      addr2,
    };
  }

  describe('setProtectedDataForSale()', () => {
    it('should set protected data for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract.setProtectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
        priceOption,
      );

      const saleParams = await protectedDataSharingContract.protectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(saleParams[0]).to.equal(true);
    });

    it('should emit ProtectedDataAddedForSale event', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract.setProtectedDataForSale(
          collectionTokenId,
          protectedDataAddress,
          priceOption,
        ),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataAddedForSale')
        .withArgs(collectionTokenId, protectedDataAddress, priceOption);
    });

    it('should only allow owner to set protected data for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createOneCollection);
      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption),
      ).to.be.revertedWith('ProtectedData is not in collection');
    });

    it("should only allow owner to set protected data for sale, provided it's not already available in subscription", async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToSubscription(collectionTokenId, protectedDataAddress);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption),
      ).to.be.revertedWith('ProtectedData available for subscription');
    });

    it("should only allow owner to set protected data for sale, provided it's not already available for renting", async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      const durationOption = new Date().getTime();
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceOption,
          durationOption,
        );

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption),
      ).to.be.revertedWith('ProtectedData available for renting');
    });

    it("should only allow owner to set protected data for sale, provided it's not already rented", async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr1 } =
        await loadFixture(addProtectedDataToCollection);
      const durationOption = new Date().getTime();
      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataToRenting(
          collectionTokenId,
          protectedDataAddress,
          priceOption,
          durationOption,
        );

      // TODO: when PRO-759 is done

      // await expect(
      //   protectedDataSharingContract
      //     .connect(addr1)
      //     .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption),
      // ).to.be.revertedWith('ProtectedData available for renting');
    });
  });

  describe('removeProtectedDataForSale()', () => {
    it('should remove protected data for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);
      await protectedDataSharingContract.removeProtectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
      );

      const saleParams = await protectedDataSharingContract.protectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
      );
      expect(saleParams[0]).to.equal(false);
    });

    it('should emit ProtectedDataRemovedFromSale event', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress } =
        await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract.setProtectedDataForSale(
        collectionTokenId,
        protectedDataAddress,
        priceOption,
      );

      await expect(
        protectedDataSharingContract.removeProtectedDataForSale(
          collectionTokenId,
          protectedDataAddress,
        ),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataRemovedFromSale')
        .withArgs(collectionTokenId, protectedDataAddress);
    });

    it('should only allow owner to remove protected data for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, addr1 } =
        await loadFixture(createOneCollection);

      const protectedDataAddress = await createDatasetForContract(addr1.address, rpcURL);

      await expect(
        protectedDataSharingContract
          .connect(addr1)
          .removeProtectedDataForSale(collectionTokenId, protectedDataAddress),
      ).to.be.revertedWith('ProtectedData is not in collection');
    });
  });

  describe('buyProtectedData() : transfer a collection', () => {
    it.only('should buy protected data successfully', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenIdFrom,
        collectionTokenIdTo,
        protectedDataAddress,
        addr2,
      } = await loadFixture(setProtectedDataForSale);

      await protectedDataSharingContract.connect(addr2).buyProtectedData(
        collectionTokenIdFrom,
        protectedDataAddress,
        ethers.Typed.uint256(collectionTokenIdTo), // Typed the params that make a difference between both similar interface
        {
          value: priceOption,
        },
      );
      const protectedDataId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      expect(
        await protectedDataSharingContract.protectedDatas(collectionTokenIdTo, protectedDataId),
      ).to.equal(protectedDataAddress);
    });

    it('should emit ProtectedDataSold event', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenIdFrom,
        collectionTokenIdTo,
        protectedDataAddress,
        addr2,
      } = await loadFixture(setProtectedDataForSale);

      await expect(
        protectedDataSharingContract.connect(addr2).buyProtectedData(
          collectionTokenIdFrom,
          protectedDataAddress,
          ethers.Typed.uint256(collectionTokenIdTo), // Typed the params that make a difference between both similar interface
          {
            value: priceOption,
          },
        ),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataSold')
        .withArgs(
          collectionTokenIdFrom,
          await protectedDataSharingContract.getAddress(),
          protectedDataAddress,
        );
    });

    it('should revert if protected data is not for sale', async () => {
      const {
        protectedDataSharingContract,
        collectionContract,
        collectionTokenIdFrom,
        collectionTokenIdTo,
        addr1,
        addr2,
      } = await loadFixture(createTwoCollection);

      const { protectedDataAddress } = await createAndAddProtectedDataToCollection(
        collectionContract,
        collectionTokenIdFrom,
        addr1,
      );

      await expect(
        protectedDataSharingContract
          .connect(addr2)
          .buyProtectedData(
            collectionTokenIdFrom,
            protectedDataAddress,
            ethers.Typed.uint256(collectionTokenIdTo),
            {
              value: priceOption,
            },
          ),
      ).to.be.revertedWith('ProtectedData not for sale');
    });

    it('should revert if the wrong amount is sent', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenIdFrom,
        collectionTokenIdTo,
        protectedDataAddress,
        addr2,
      } = await loadFixture(setProtectedDataForSale);

      await expect(
        protectedDataSharingContract.connect(addr2).buyProtectedData(
          collectionTokenIdFrom,
          protectedDataAddress,
          ethers.Typed.uint256(collectionTokenIdTo),
          { value: ethers.parseEther('0.8') }, // Sending the wrong amount
        ),
      ).to.be.revertedWith('Wrong amount sent');
    });

    it('should revert if you send a protectedData to a collection not owned by you', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
        addr3,
      } = await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption);

      const tx = await protectedDataSharingContract.connect(addr3).createCollection();
      const receipt = await tx.wait();
      const collectionTokenIdTo = ethers.toNumber(receipt.logs[0].args[2]);

      await expect(
        protectedDataSharingContract
          .connect(addr2)
          .buyProtectedData(
            collectionTokenId,
            protectedDataAddress,
            ethers.Typed.uint256(collectionTokenIdTo),
            {
              value: priceOption,
            },
          ),
      ).to.be.revertedWith("Not the collection's owner");
    });
  });

  describe('buyProtectedData() transfer to a non-collection', () => {
    it('should buy protected data successfully', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption);

      await protectedDataSharingContract.connect(addr2).buyProtectedData(
        collectionTokenId,
        protectedDataAddress,
        ethers.Typed.address(addr2.address), // Typed the params that make a difference between both similar interface
        {
          value: priceOption,
        },
      );
      const registry = await ethers.getContractAt(
        'IDatasetRegistry',
        '0x799daa22654128d0c64d5b79eac9283008158730',
      );
      const protectedDataTokenId = ethers.getBigInt(protectedDataAddress.toLowerCase()).toString();
      expect(await registry.ownerOf(protectedDataTokenId)).to.equal(addr2.address);
    });

    it('should emit ProtectedDataSold event', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption);

      await expect(
        protectedDataSharingContract.connect(addr2).buyProtectedData(
          collectionTokenId,
          protectedDataAddress,
          ethers.Typed.address(addr2.address), // Typed the params that make a difference between both similar interface
          {
            value: priceOption,
          },
        ),
      )
        .to.emit(protectedDataSharingContract, 'ProtectedDataSold')
        .withArgs(collectionTokenId, addr2.address, protectedDataAddress);
    });

    it('should revert if protected data is not for sale', async () => {
      const { protectedDataSharingContract, collectionTokenId, protectedDataAddress, addr2 } =
        await loadFixture(addProtectedDataToCollection);

      await expect(
        protectedDataSharingContract.connect(addr2).buyProtectedData(
          collectionTokenId,
          protectedDataAddress,
          ethers.Typed.address(addr2.address), // Typed the params that make a difference between both similar interface
          {
            value: priceOption,
          },
        ),
      ).to.be.revertedWith('ProtectedData not for sale');
    });

    it('should revert if the wrong amount is sent', async () => {
      const {
        protectedDataSharingContract,
        collectionTokenId,
        protectedDataAddress,
        addr1,
        addr2,
      } = await loadFixture(addProtectedDataToCollection);

      await protectedDataSharingContract
        .connect(addr1)
        .setProtectedDataForSale(collectionTokenId, protectedDataAddress, priceOption);

      await expect(
        protectedDataSharingContract.connect(addr2).buyProtectedData(
          collectionTokenId,
          protectedDataAddress,
          ethers.Typed.address(addr2.address), // Typed the params that make a difference between both similar interface
          { value: ethers.parseEther('0.8') }, // Sending the wrong amount
        ),
      ).to.be.revertedWith('Wrong amount sent');
    });
  });
});
