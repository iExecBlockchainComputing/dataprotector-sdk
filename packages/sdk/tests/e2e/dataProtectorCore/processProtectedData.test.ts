import { describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '../../../src/index.js';
import { processProtectedData } from '../../../src/lib/dataProtectorCore/processProtectedData.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  SELECTED_CHAIN,
  TEST_CHAINS,
  addVoucherEligibleAsset,
  createAndPublishAppOrders,
  createAndPublishWorkerpoolOrder,
  createVoucher,
  createVoucherType,
  deployRandomApp,
  depositNRlcForAccount,
  getTestConfig,
  timeouts,
} from '../../test-utils.js';

const processProtectedDataTaskStatus = async ({
  iexec,
  appAddress,
  protectedDataAddress,
  useVoucher,
  secrets,
  args,
}) => {
  let testResolve;
  const testPromise = new Promise((resolve) => {
    testResolve = resolve;
  });
  const status = [];
  const onStatusUpdateWrapper = ({ title, isDone, payload }) => {
    status.push({ title, isDone, payload });
    if (title === 'CONSUME_TASK') {
      testResolve();
    }
  };

  processProtectedData({
    iexec,
    protectedData: protectedDataAddress,
    app: appAddress,
    maxPrice: 1000,
    workerpool: TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool,
    useVoucher,
    secrets,
    args,
    onStatusUpdate: onStatusUpdateWrapper,
  });

  await testPromise; // wait for the manual resolution
  return status;
};

describe('dataProtectorCore.processProtectedData()', () => {
  let iexec: IExec;
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let appAddress: string;
  const workerpoolprice = 5;
  const appprice = 10;
  const onStatusUpdateMock = jest.fn();
  let workerpoolAddress: string;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    // create app & workerpool
    const [ethProvider, options] = getTestConfig(wallet.privateKey);
    appAddress = await deployRandomApp({
      ethProvider,
      teeFramework: 'scone',
    });
    iexec = new IExec({ ethProvider }, options.iexecOptions);
    await createAndPublishAppOrders(iexec, appAddress, appprice);
    await createAndPublishWorkerpoolOrder(
      TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool,
      TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpoolOwnerWallet,
      workerpoolprice
    );

    workerpoolAddress = await iexec.ens.resolveName(
      TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool
    );
    // create protectedData
    protectedData = await dataProtectorCore.protectData({
      data: { email: 'example@example.com' },
      name: 'test do not use',
    });
    await dataProtectorCore.grantAccess({
      authorizedApp: appAddress,
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
      numberOfAccess: 1000,
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it.only(
    'should throw error if no orders found within the specified price limit maxPrice nRLC',
    async () => {
      let error;
      try {
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          workerpool: TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool,
          useVoucher: true,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          onStatusUpdate: onStatusUpdateMock,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Failed to process protected data');
      expect(error.cause.message).toBe(
        `No orders found within the specified price limit 0 nRLC.`
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should successfully process a protected data',
    async () => {
      const userWalletAddress = await iexec.wallet.getAddress();
      await depositNRlcForAccount(userWalletAddress, 10_000_000);

      const status = await processProtectedDataTaskStatus({
        iexec,
        appAddress,
        protectedDataAddress: protectedData.address,
        useVoucher: false,
        secrets: {
          1: 'ProcessProtectedData test subject',
          2: 'email content for test processData',
        },
        args: '_args_test_process_data_',
      });

      expect(status[9].title).toBe('REQUEST_TO_PROCESS_PROTECTED_DATA');
      expect(status[9].isDone).toBe(true);
      expect(status[9].payload.taskId).toBeDefined();
    },
    3 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'use voucher - should throw error if no voucher available for the requester',
    async () => {
      let error;
      try {
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          maxPrice: 1000,
          workerpool: TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool,
          useVoucher: true,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          onStatusUpdate: onStatusUpdateMock,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Failed to process protected data');
      expect(error.cause.message).toBe(
        `No voucher available for the requester ${wallet.address}`
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'use voucher - should throw error if app is not sponsored by voucher',
    async () => {
      const voucherType = await createVoucherType({
        description: 'test voucher',
        duration: 60 * 60,
      });

      const userWalletAddress = await iexec.wallet.getAddress();
      await addVoucherEligibleAsset(workerpoolAddress, voucherType);
      await createVoucher({
        owner: userWalletAddress,
        voucherType: voucherType,
        value: 100,
      });
      let error;
      try {
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          workerpool: TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool,
          maxPrice: 1000,
          useVoucher: true,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          onStatusUpdate: onStatusUpdateMock,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Failed to process protected data');
      expect(error.cause.message).toBe(
        `Orders can't be matched. Please approve an additional ${appprice} for voucher usage.`
      );
    },
    timeouts.createVoucherType +
      timeouts.createVoucher +
      2 * MAX_EXPECTED_BLOCKTIME +
      MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'use voucher - should throw error if workerpool is not sponsored by voucher',
    async () => {
      const voucherType = await createVoucherType({
        description: 'test voucher',
        duration: 60 * 60,
      });

      const userWalletAddress = await iexec.wallet.getAddress();
      await addVoucherEligibleAsset(appAddress, voucherType);
      await createVoucher({
        owner: userWalletAddress,
        voucherType: voucherType,
        value: 100,
      });
      let error;
      try {
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          workerpool: TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool,
          maxPrice: 1000,
          useVoucher: true,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          onStatusUpdate: onStatusUpdateMock,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Failed to process protected data');
      expect(error.cause.message).toBe(
        `Orders can't be matched. Please approve an additional ${workerpoolprice} for voucher usage.`
      );
    },
    timeouts.createVoucherType +
      timeouts.createVoucher +
      2 * MAX_EXPECTED_BLOCKTIME +
      MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'use voucher - should successfully create task when app and workerpool are sponsored & sufficient voucher amount',
    async () => {
      const voucherType = await createVoucherType({
        description: 'test voucher',
        duration: 60 * 60,
      });

      const userWalletAddress = await iexec.wallet.getAddress();
      await createVoucher({
        owner: userWalletAddress,
        voucherType: voucherType,
        value: 100_000,
      });

      await addVoucherEligibleAsset(workerpoolAddress, voucherType);
      await addVoucherEligibleAsset(appAddress, voucherType);

      const status = await processProtectedDataTaskStatus({
        iexec,
        appAddress,
        protectedDataAddress: protectedData.address,
        useVoucher: true,
        secrets: {
          1: 'ProcessProtectedData test subject',
          2: 'email content for test processData',
        },
        args: '_args_test_process_data_',
      });
      expect(status[9].title).toBe('REQUEST_TO_PROCESS_PROTECTED_DATA');
      expect(status[9].isDone).toBe(true);
      expect(status[9].payload.taskId).toBeDefined();
    },
    timeouts.createVoucherType +
      timeouts.createVoucher +
      2 * timeouts.addEligibleAsset +
      timeouts.processProtectedData +
      10 * MAX_EXPECTED_BLOCKTIME
  );

  it(
    'use voucher - should throw error if insufficient voucher amount',
    async () => {
      const voucherType = await createVoucherType({
        description: 'test voucher',
        duration: 60 * 60,
      });
      const userWalletAddress = await iexec.wallet.getAddress();
      const voucherAmount = 1;
      await createVoucher({
        owner: userWalletAddress,
        voucherType: voucherType,
        value: 1,
      });
      await addVoucherEligibleAsset(workerpoolAddress, voucherType);
      await addVoucherEligibleAsset(appAddress, voucherType);

      let error;
      try {
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          workerpool: TEST_CHAINS[SELECTED_CHAIN].assetConfig.prodWorkerpool,
          maxPrice: 1000,
          useVoucher: true,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          onStatusUpdate: onStatusUpdateMock,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Failed to process protected data');
      const missingAmount = workerpoolprice + appprice - voucherAmount;
      expect(error.cause.message).toBe(
        `Orders can't be matched. Please approve an additional ${missingAmount} for voucher usage.`
      );
    },
    timeouts.createVoucherType +
      timeouts.createVoucher +
      2 * MAX_EXPECTED_BLOCKTIME +
      MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'use voucher - should successfully create a task when user deposits to cover the missing amount',
    async () => {
      const voucherType = await createVoucherType({
        description: 'test voucher',
        duration: 60 * 60,
      });
      const userWalletAddress = await iexec.wallet.getAddress();
      const voucherAmount = 1;
      const voucherAddress = await createVoucher({
        owner: userWalletAddress,
        voucherType: voucherType,
        value: voucherAmount,
      });
      await addVoucherEligibleAsset(workerpoolAddress, voucherType);
      await addVoucherEligibleAsset(appAddress, voucherType);
      const missingAmount = workerpoolprice + appprice - voucherAmount;

      await depositNRlcForAccount(userWalletAddress, missingAmount);
      await iexec.account.approve(missingAmount, voucherAddress);

      const status = await processProtectedDataTaskStatus({
        iexec,
        protectedDataAddress: protectedData.address,
        appAddress,
        useVoucher: true,
        secrets: {
          1: 'ProcessProtectedData test subject',
          2: 'email content for test processData',
        },
        args: '_args_test_process_data_',
      });

      expect(status[9].title).toBe('REQUEST_TO_PROCESS_PROTECTED_DATA');
      expect(status[9].isDone).toBe(true);
      expect(status[9].payload.taskId).toBeDefined();
    },
    timeouts.createVoucherType +
      timeouts.createVoucher +
      2 * MAX_EXPECTED_BLOCKTIME +
      MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
