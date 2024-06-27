import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { createCollectionWithProtectedDataRentableAndSubscribable } from './fixtures/consumeProtectedDataFixture.js';
import { createNonFreeWorkerpoolOrder, voucherAuthorizeSharingContract } from './fixtures/globalFixture.js';
import {
  createVoucherExpired,
  createVoucherWithWorkerpoolOrderSponsorable,
  createVoucherWithWorkerpoolOrderTooExpensive,
} from './fixtures/voucherFixture.js';

const { ethers } = pkg;

describe('ConsumeProtectedData', () => {
  describe('without voucher - consumeProtectedData()', () => {
    it('should create a deal on chain if an end user subscribe to the collection', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
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
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);
      const { workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.reverted;
    });

    it('should create a deal on chain if the user can pay for the workerpool', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);
      const { workerpoolprice, workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      const approveTx = await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price + workerpoolprice);
      approveTx.wait();
      const depoTx = await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits((subscriptionParams.price + workerpoolprice).toString(), 'gwei'),
      }); // value sent should be in wei
      depoTx.wait();
      const subscribeTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      subscribeTx.wait();

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
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
        rentingParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);

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
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, workerpoolOrder, addr2 } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user subscription is expired', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);

      await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
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
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
        rentingParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);

      await pocoContract.connect(addr2).approve(await dataProtectorSharingContract.getAddress(), rentingParams.price);
      await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(rentingParams.price.toString(), 'gwei'),
      }); // value sent should be in wei
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
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(
        createVoucherWithWorkerpoolOrderSponsorable,
      );
      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();
      await voucherAuthorizeSharingContract({ dataProtectorSharingAddress, voucherOwner, voucherAddress });

      await pocoContract
        .connect(voucherOwner)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(voucherOwner).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei

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
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(createVoucherExpired);

      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();
      await voucherAuthorizeSharingContract({ dataProtectorSharingAddress, voucherOwner, voucherAddress });

      await pocoContract
        .connect(voucherOwner)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(voucherOwner).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      // Expect the consumeProtectedData transaction to revert with an error message indicating the voucher is expired
      await expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.revertedWith('Voucher: voucher is expired'); // Replace 'Voucher is expired' with the actual revert message
    });

    it('should revert if the consumer has authorized the sharing contract to use the voucher but voucher balance is insufficient', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(
        createVoucherWithWorkerpoolOrderTooExpensive,
      );
      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();
      await voucherAuthorizeSharingContract({ dataProtectorSharingAddress, voucherOwner, voucherAddress });

      await pocoContract
        .connect(voucherOwner)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(voucherOwner).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      await expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.reverted;
    });

    it('should revert if the consumer has not authorized the DataProtectorSharing contract to use the voucher', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);
      const { voucherOwner, workerpoolOrder } = await loadFixture(createVoucherWithWorkerpoolOrderSponsorable);

      await pocoContract
        .connect(voucherOwner)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(voucherOwner).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value sent should be in wei

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      await expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.reverted;
    });

    it('should create a deal on chain if the voucher balance plus account allowance is sufficient', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribable);
      const dataProtectorSharingAddress = await dataProtectorSharingContract.getAddress();
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(
        createVoucherWithWorkerpoolOrderSponsorable,
      );

      await voucherAuthorizeSharingContract({ dataProtectorSharingAddress, voucherOwner, voucherAddress });
      await pocoContract
        .connect(voucherOwner)
        .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
      await pocoContract.connect(voucherOwner).deposit({
        value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
      }); // value for the subscription

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      const workerpoolprice = 1; // in nRLC
      await pocoContract.connect(voucherOwner).deposit({
        value: ethers.parseUnits(workerpoolprice.toString(), 'gwei'),
      }); // value for the workerpoolprice
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
