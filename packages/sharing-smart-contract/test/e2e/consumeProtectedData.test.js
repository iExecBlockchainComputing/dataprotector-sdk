import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { createCollectionWithProtectedDataRentableAndSubscribableForFree } from './fixtures/consumeProtectedDataFixture.js';
import { createNonFreeWorkerpoolOrder } from './fixtures/globalFixture.js';
import {
  createVoucherExpired,
  createVoucherWithWorkerpoolOrderSponsorable,
  createVoucherWithWorkerpoolOrderTooExpensive,
} from './fixtures/voucherFixture.js';
import { voucherAuthorizeSharingContract } from './utils/voucher.utils.js';

const { ethers } = pkg;

describe('ConsumeProtectedData voucher overload "consumeProtectedData(address,(address,uint256,uint256,bytes32,uint256,uint256,address,address,address,bytes32,bytes),address,bool)"', () => {
  const CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION =
    'consumeProtectedData(address,(address,uint256,uint256,bytes32,uint256,uint256,address,address,address,bytes32,bytes),address,bool)';

  describe('without voucher - consumeProtectedData()', () => {
    it('should create a deal on chain if an end user subscribe to the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, false);
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
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      expect(
        dataProtectorSharingContract
          .connect(addr2)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, false),
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
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { workerpoolprice, workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      const approveTx = await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), workerpoolprice);
      approveTx.wait();
      const depoTx = await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(workerpoolprice.toString(), 'gwei'),
      }); // value sent should be in wei
      depoTx.wait();
      const subscribeTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      subscribeTx.wait();

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, false);
      await tx.wait();

      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(_protectedDataAddress, protectedDataAddress, 'DealId should be of type bytes32');
          assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
        });
    });

    it('should create a deal on chain if the user can pay for the workerpool with approveAndCall', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { workerpoolprice, workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      const depoTx = await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(workerpoolprice.toString(), 'gwei'),
      }); // value sent should be in wei
      depoTx.wait();

      const subscribeTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      subscribeTx.wait();

      const callData = dataProtectorSharingContract.interface.encodeFunctionData(
        CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION,
        [protectedDataAddress, workerpoolOrder, appAddress, false],
      );

      const tx = await pocoContract
        .connect(addr2)
        .approveAndCall(await dataProtectorSharingContract.getAddress(), workerpoolprice, callData);
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
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, workerpoolOrder, rentingParams, addr2 } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, rentingParams);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, false);
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
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user subscription is expired', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
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
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user rental is expired', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, workerpoolOrder, rentingParams, addr2 } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, rentingParams);
      // advance time by one hour and mine a new block
      await time.increase(rentingParams.duration);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, false),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });
  });

  describe('voucher - consumeProtectedData()', () => {
    it('should create a deal on chain and consume asset in the user voucher if the voucher balance is sufficient', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(
        createVoucherWithWorkerpoolOrderSponsorable,
      );

      await voucherAuthorizeSharingContract({ dataProtectorSharingContract, voucherOwner, voucherAddress });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      const tx = await dataProtectorSharingContract
        .connect(voucherOwner)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, true);
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
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(createVoucherExpired);

      await voucherAuthorizeSharingContract({ dataProtectorSharingContract, voucherOwner, voucherAddress });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      // Expect the consumeProtectedData transaction to revert with an error message indicating the voucher is expired
      await expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.revertedWith('Voucher: voucher is expired'); // Replace 'Voucher is expired' with the actual revert message
    });

    it('should revert if the consumer has authorized the sharing contract to use the voucher but voucher balance is insufficient', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(
        createVoucherWithWorkerpoolOrderTooExpensive,
      );

      await voucherAuthorizeSharingContract({ dataProtectorSharingContract, voucherOwner, voucherAddress });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      await expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.reverted;
    });

    it('should revert if the consumer has not authorized the DataProtectorSharing contract to use the voucher', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, collectionTokenId, subscriptionParams } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { voucherOwner, workerpoolOrder } = await loadFixture(createVoucherWithWorkerpoolOrderSponsorable);

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams);

      await expect(
        dataProtectorSharingContract
          .connect(voucherOwner)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, true),
      ).to.be.reverted;
    });

    // skipped as voucher does not allow partial sponsoring of eligible assets
    it.skip('should create a deal on chain if the voucher balance plus account allowance is sufficient', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { voucherOwner, workerpoolOrder, voucherAddress } = await loadFixture(
        createVoucherWithWorkerpoolOrderTooExpensive,
      );

      await voucherAuthorizeSharingContract({ dataProtectorSharingContract, voucherOwner, voucherAddress });

      await dataProtectorSharingContract
        .connect(voucherOwner)
        .subscribeToCollection(collectionTokenId, subscriptionParams)
        .then(tx => tx.wait());

      const { workerpoolprice } = workerpoolOrder;
      await pocoContract
        .connect(voucherOwner)
        .deposit({
          value: ethers.parseUnits(workerpoolprice.toString(), 'gwei'),
        })
        .then(tx => tx.wait()); // value for the workerpoolprice
      await pocoContract
        .connect(voucherOwner)
        .approve(voucherAddress, workerpoolprice)
        .then(tx => tx.wait());

      // TODO: remove debug logs
      console.log('user balance', await pocoContract.balanceOf(voucherOwner));
      console.log('allowance', await pocoContract.allowance(voucherOwner, voucherAddress));

      console.log('workerpoolprice', workerpoolOrder.workerpoolprice);

      const voucherContract = await ethers.getContractAt('IVoucher', voucherAddress);
      console.log(
        'isAccountAuthorized(dataProtectorSharingAddress)',
        await voucherContract.isAccountAuthorized(await dataProtectorSharingContract.getAddress()),
      );

      const tx = await dataProtectorSharingContract
        .connect(voucherOwner)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress, true);
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

describe('ConsumeProtectedData legacy overload "consumeProtectedData(address,(address,uint256,uint256,bytes32,uint256,uint256,address,address,address,bytes32,bytes),address)"', () => {
  const CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION =
    'consumeProtectedData(address,(address,uint256,uint256,bytes32,uint256,uint256,address,address,address,bytes32,bytes),address)';

  describe('consumeProtectedData()', () => {
    it('should create a deal on chain if an end user subscribe to the collection', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress);
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
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      await dataProtectorSharingContract.connect(addr2).subscribeToCollection(collectionTokenId, subscriptionParams);

      expect(
        dataProtectorSharingContract
          .connect(addr2)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress),
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
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { workerpoolprice, workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      const approveTx = await pocoContract
        .connect(addr2)
        .approve(await dataProtectorSharingContract.getAddress(), workerpoolprice);
      approveTx.wait();
      const depoTx = await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(workerpoolprice.toString(), 'gwei'),
      }); // value sent should be in wei
      depoTx.wait();
      const subscribeTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      subscribeTx.wait();

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress);
      await tx.wait();

      expect(tx)
        .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
        .withArgs((_dealId, _protectedDataAddress, _mode) => {
          assert.equal(_dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
          assert.equal(_protectedDataAddress, protectedDataAddress, 'DealId should be of type bytes32');
          assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
        });
    });

    it('should create a deal on chain if the user can pay for the workerpool with approveAndCall', async () => {
      const {
        dataProtectorSharingContract,
        pocoContract,
        protectedDataAddress,
        appAddress,
        collectionTokenId,
        subscriptionParams,
        addr2,
      } = await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);
      const { workerpoolprice, workerpoolOrder } = await loadFixture(createNonFreeWorkerpoolOrder);

      const depoTx = await pocoContract.connect(addr2).deposit({
        value: ethers.parseUnits(workerpoolprice.toString(), 'gwei'),
      }); // value sent should be in wei
      depoTx.wait();

      const subscribeTx = await dataProtectorSharingContract
        .connect(addr2)
        .subscribeToCollection(collectionTokenId, subscriptionParams);
      subscribeTx.wait();

      const callData = dataProtectorSharingContract.interface.encodeFunctionData(
        CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION,
        [protectedDataAddress, workerpoolOrder, appAddress],
      );

      const tx = await pocoContract
        .connect(addr2)
        .approveAndCall(await dataProtectorSharingContract.getAddress(), workerpoolprice, callData);
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
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, workerpoolOrder, rentingParams, addr2 } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, rentingParams);

      const tx = await dataProtectorSharingContract
        .connect(addr2)
        [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress);
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
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user subscription is expired', async () => {
      const {
        dataProtectorSharingContract,
        protectedDataAddress,
        appAddress,
        workerpoolOrder,
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
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });

    it('should revert if the user rental is expired', async () => {
      const { dataProtectorSharingContract, protectedDataAddress, appAddress, workerpoolOrder, rentingParams, addr2 } =
        await loadFixture(createCollectionWithProtectedDataRentableAndSubscribableForFree);

      await dataProtectorSharingContract.connect(addr2).rentProtectedData(protectedDataAddress, rentingParams);
      // advance time by one hour and mine a new block
      await time.increase(rentingParams.duration);

      await expect(
        dataProtectorSharingContract
          .connect(addr2)
          [CONSUME_PROTECTED_DATA_FUNCTION_DESCRIPTION](protectedDataAddress, workerpoolOrder, appAddress),
      ).to.be.revertedWithCustomError(dataProtectorSharingContract, 'NoValidRentalOrSubscription');
    });
  });
});
