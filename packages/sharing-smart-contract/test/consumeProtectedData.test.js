import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { createCollectionWithProtectedDataRatableAndSubscribable } from './utils/loadFixture.test.js';

const { ethers } = pkg;

describe('ConsumeProtectedData', () => {
  describe('consumeProtectedData()', () => {
    it('should create a deal on chain if an end user subscribe to the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

      await dataProtectorSharingContract.connect(addr2).subscribeTo(collectionTokenId, {
        value: subscriptionParams.price,
      });

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, '');
      await tx.wait();

      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(
            _protectedDataAddress,
            protectedDataAddress,
            'DealId should be of type bytes32',
          );
          assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
        });
    });

    it('should create a deal on chain if an end user rent a protectedData inside a collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        rentingParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

      await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: rentingParams.price,
        });

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, '');
      await tx.wait();
      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(
            _protectedDataAddress,
            protectedDataAddress,
            'DealId should be of type bytes32',
          );
          assert.equal(_mode, 1, 'Mode should be RENTING (1)');
        });
    });

    it('should revert if the user does not have an ongoing subscription or rental', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, ''),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user subscription is expired', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

      await dataProtectorSharingContract.connect(addr2).subscribeTo(collectionTokenId, {
        value: subscriptionParams.price,
      });
      // advance time by one hour and mine a new block
      await time.increase(subscriptionParams.duration);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, ''),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user rental is expired', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        workerpoolOrder,
        collectionTokenId,
        rentingParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

      await dataProtectorSharingContract
        .connect(addr2)
        .rentProtectedData(collectionTokenId, protectedDataAddress, {
          value: rentingParams.price,
        });
      // advance time by one hour and mine a new block
      await time.increase(rentingParams.duration);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(collectionTokenId, protectedDataAddress, workerpoolOrder, ''),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });
  });
});
