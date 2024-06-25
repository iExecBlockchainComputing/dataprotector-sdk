import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import {
  createAccountWithVoucher,
  createCollectionWithProtectedDataRentableAndSubscribableForFree,
  getFreeWorkerpoolOrder,
  getWorkerpoolOrder,
} from './utils/loadFixture.test.js';

const { ethers } = pkg;

describe('ConsumeProtectedData', () => {
  describe('consumeProtectedData()', () => {
    it('should create a deal on chain if an end user subscribe to the collection', async () => {
      const workerpoolOrder = await loadFixture(getFreeWorkerpoolOrder);
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false);
      await tx.wait();

      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(_protectedDataAddress, protectedDataAddress, 'DealId should be of type bytes32');
          assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
        });
    });

    it('should revert if the user cannot pay for the workerpool', async () => {
      const workerpoolOrder = await loadFixture(getWorkerpoolOrder);
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false);
      await tx.wait();

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.reverted;
    });

    it('should create a deal on chain if the user can pay for the workerpool', async () => {
      const workerpoolOrder = await loadFixture(getWorkerpoolOrder);
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        pocoContract,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      // deposit workerpool price on account
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(workerpoolOrder.workerpoolprice.toString(), 'gwei'),
      });
      // approve the sharing contract to use the user account
      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), workerpoolOrder.workerpoolprice);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false);
      await tx.wait();

      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(_protectedDataAddress, protectedDataAddress, 'DealId should be of type bytes32');
          assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
        });
    });

    it('should create a deal on chain if an end user rent a protectedData inside a collection', async () => {
      const workerpoolOrder = await loadFixture(getFreeWorkerpoolOrder);
      const { dataProtectorSharingContract, pocoContract, protectedDataAddress, appAddress, rentingParams, addr2 } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await pocoContract.connect(addr2).approve(await dataProtectorSharingContract.getAddress(), rentingParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(rentingParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      await dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, rentingParams);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false);
      await tx.wait();
      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(_protectedDataAddress, protectedDataAddress, 'DealId should be of type bytes32');
          assert.equal(_mode, 1, 'Mode should be RENTING (1)');
        });
    });

    it('should revert if the user does not have an ongoing subscription or rental', async () => {
      const workerpoolOrder = await loadFixture(getFreeWorkerpoolOrder);
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, addr2 } = await loadFixture(
        createCollectionWithProtectedDataRentableAndSubscribableForFree,
      );

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user subscription is expired', async () => {
      const workerpoolOrder = await loadFixture(getFreeWorkerpoolOrder);
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);
      // advance time by one hour and mine a new block
      await time.increase(subscriptionParams.duration);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user rental is expired', async () => {
      const workerpoolOrder = await loadFixture(getFreeWorkerpoolOrder);
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, rentingParams, addr2 } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, rentingParams);
      // advance time by one hour and mine a new block
      await time.increase(rentingParams.duration);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });
  });

  describe('voucher - consumeProtectedData()', () => {
    it('should create a deal on chain and consume asset in the user voucher if the voucher balance is sufficient', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();

      const { voucherOwner, workerpoolOrder } = await createAccountWithVoucher({
        voucherValue: 1000,
        authorizedAccount: dataProtectorSharingAddress,
        workerpoolprice: 100,
      });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      const tx = await dataProtectorSharingContract
        .connect(voucherOwner)
        .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true);
      await tx.wait();

      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(_protectedDataAddress, protectedDataAddress, 'DealId should be of type bytes32');
          assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
        });
    });

    it('should revert if the voucher is expired', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();
      const { voucherOwner, workerpoolOrder } = await createAccountWithVoucher({
        voucherDuration: 1,
        voucherValue: 1000,
        authorizedAccount: dataProtectorSharingAddress,
        workerpoolprice: 100,
      });

      // wait voucher expiration
      await time.increase(5);

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.reverted;
    });

    it('should revert if the voucher balance is insufficient', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();
      const { voucherOwner, workerpoolOrder } = await createAccountWithVoucher({
        voucherValue: 99,
        authorizedAccount: dataProtectorSharingAddress,
        workerpoolprice: 100,
      });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.reverted;
    });

    it('should revert if the consumer has not authorized the DataProtectorSharing contract to use the voucher', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      const { voucherOwner, workerpoolOrder } = await createAccountWithVoucher({
        voucherValue: 1000,
        workerpoolprice: 100,
      });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.reverted;
    });

    it('should create a deal on chain if the voucher balance plus account allowance is sufficient', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();

      const { voucherOwner, workerpoolOrder } = await createAccountWithVoucher({
        voucherValue: 60,
        authorizedAccount: dataProtectorSharingAddress,
        workerpoolprice: 100,
        accountBalance: 60,
        voucherAllowance: 60,
      });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      const tx = await dataProtectorSharingContract
        .connect(voucherOwner)
        .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true);
      await tx.wait();

      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(_protectedDataAddress, protectedDataAddress, 'DealId should be of type bytes32');
          assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
        });
    });
  });
});
