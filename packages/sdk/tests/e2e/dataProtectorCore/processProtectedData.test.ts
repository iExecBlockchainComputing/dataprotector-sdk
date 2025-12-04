import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomApp,
  getTestConfig,
  setNRlcBalance,
} from '../../test-utils.js';

describe('dataProtectorCore.processProtectedData() (waitForResult: false)', () => {
  let iexec: IExec;
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let appAddress: string;
  let workerpoolAddress: string;

  beforeAll(async () => {
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
    await iexec.order
      .createApporder({ app: appAddress, volume: 1000, tag: ['tee', 'scone'] })
      .then(iexec.order.signApporder)
      .then(iexec.order.publishApporder);
    const { address: workerpool } = await iexec.workerpool.deployWorkerpool({
      description: 'test pool',
      owner: await iexec.wallet.getAddress(),
    });
    workerpoolAddress = workerpool;
    await iexec.order
      .createWorkerpoolorder({
        workerpool: workerpoolAddress,
        category: 0,
        volume: 1000,
        tag: ['tee', 'scone'],
      })
      .then(iexec.order.signWorkerpoolorder)
      .then(iexec.order.publishWorkerpoolorder);

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

  describe.skip('waitForResult: true (default)', () => {
    it(
      'should successfully process a protected data should successfully process a protected data and return txHash, dealId, taskId, result and pemPrivateKey',
      async () => {
        // --- GIVEN
        const onStatusUpdateMock = jest.fn();

        iexec.task.obsTask = jest.fn<any>().mockResolvedValue({
          subscribe: ({ complete }) => {
            if (complete) {
              complete();
            }

            return () => {};
          },
        });

        const mockArrayBuffer = new ArrayBuffer(8);
        jest.unstable_mockModule(
          '../../../src/lib/dataProtectorCore/getResultFromCompletedTask.js',
          () => {
            return {
              getResultFromCompletedTask: jest
                .fn<() => Promise<ArrayBuffer>>()
                .mockResolvedValue(mockArrayBuffer),
            };
          }
        );

        // import tested module after all mocked modules
        const { processProtectedData } = await import(
          '../../../src/lib/dataProtectorCore/processProtectedData.js'
        );

        // --- WHEN
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          defaultWorkerpool: workerpoolAddress,
          workerpool: workerpoolAddress,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          path: 'computed.json',
          onStatusUpdate: onStatusUpdateMock,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'FETCH_PROTECTED_DATA_ORDERBOOK',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'FETCH_APP_ORDERBOOK',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'FETCH_WORKERPOOL_ORDERBOOK',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'PUSH_REQUESTER_SECRET',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'FETCH_PROTECTED_DATA_ORDERBOOK',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'PROCESS_PROTECTED_DATA_REQUESTED',
          isDone: true,
          payload: {
            txHash: expect.any(String),
          },
        });
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('waitForResult: false', () => {
    it(
      'should successfully process a protected data and return txHash, dealId, taskId and pemPrivateKey',
      async () => {
        // --- GIVEN
        const onStatusUpdateMock = jest.fn();

        // import tested module after all mocked modules
        const { processProtectedData } = await import(
          '../../../src/lib/dataProtectorCore/processProtectedData.js'
        );

        // --- WHEN
        const res = await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          defaultWorkerpool: workerpoolAddress,
          workerpool: workerpoolAddress,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          path: 'computed.json',
          onStatusUpdate: onStatusUpdateMock,
          waitForResult: false,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
          title: 'FETCH_ORDERS',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
          title: 'FETCH_ORDERS',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(3, {
          title: 'PUSH_REQUESTER_SECRET',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(4, {
          title: 'PUSH_REQUESTER_SECRET',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(5, {
          title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(6, {
          title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
          isDone: true,
          payload: {
            dealId: res.dealId,
            taskId: res.taskId,
            txHash: res.txHash,
          },
        });
        expect(res.dealId).toEqual(expect.any(String));
        expect(res.taskId).toEqual(expect.any(String));
        expect(res.txHash).toEqual(expect.any(String));
        expect(res.pemPrivateKey).toBeUndefined();
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('encryptResult: true', () => {
    it(
      'should create pemPrivateKey when none is provided',
      async () => {
        // --- GIVEN
        const onStatusUpdateMock = jest.fn();

        // import tested module after all mocked modules
        const { processProtectedData } = await import(
          '../../../src/lib/dataProtectorCore/processProtectedData.js'
        );

        // --- WHEN
        const res = await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          defaultWorkerpool: workerpoolAddress,
          workerpool: workerpoolAddress,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          path: 'computed.json',
          onStatusUpdate: onStatusUpdateMock,
          encryptResult: true,
          waitForResult: false,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
          title: 'FETCH_ORDERS',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
          title: 'FETCH_ORDERS',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(3, {
          title: 'PUSH_REQUESTER_SECRET',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(4, {
          title: 'PUSH_REQUESTER_SECRET',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(5, {
          title: 'GENERATE_ENCRYPTION_KEY',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(6, {
          title: 'GENERATE_ENCRYPTION_KEY',
          isDone: true,
          payload: {
            pemPrivateKey: res.pemPrivateKey,
          },
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(7, {
          title: 'PUSH_ENCRYPTION_KEY',
          isDone: false,
          payload: {
            pemPublicKey: expect.any(String),
          },
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(8, {
          title: 'PUSH_ENCRYPTION_KEY',
          isDone: true,
          payload: {
            pemPublicKey: expect.any(String),
          },
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(9, {
          title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(10, {
          title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
          isDone: true,
          payload: {
            dealId: res.dealId,
            taskId: res.taskId,
            txHash: res.txHash,
          },
        });
        expect(res.dealId).toEqual(expect.any(String));
        expect(res.taskId).toEqual(expect.any(String));
        expect(res.txHash).toEqual(expect.any(String));
        expect(res.pemPrivateKey).toEqual(expect.any(String));
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
    it(
      'should use pemPrivateKey when one is provided',
      async () => {
        // --- GIVEN
        const onStatusUpdateMock = jest.fn();
        const expectedPemPrivateKey =
          '-----BEGIN PRIVATE KEY-----\n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\nRy0tMwOsNPN0/APFvotIYNf3O9hrHg==\n-----END PRIVATE KEY-----';
        const expectedPublicKey =
          '-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAi6RuRnDwIVJjWwzm3FrO\n2wmBDOcNzWt4c341LbwHV5qhJeztctk0E054aqQe9KnAq2F3PUHsUpf6Twx74dVm\n3SYTLXY79QEY1d9KeDer0jb10Jiog8CeU5RQMEg3RKdL0it/IP9K39z9wI9W/C0I\nXZmvohnyng3/jwK/5+8IVs0q5mNME9jDqaSaVAoB+Fw+VeY+MvZSVlRzMtmt3TiF\nCyER9u0VWeVPq46CZsbSMPaIW6g3A7VV6HiX2wBt98yGHdRLvyWgg1P7a4WBxsW6\na7SIZdoRhAYo+MslwZ5qcp+el2rY2udsmRDHxUTPq2ELnUldYv0WJ+QjKZEpnGhY\nFX9ZemzKwU9P5z9TOemKX8AGZPJYxRWnV5nkGuwbBSOkeWcVNPGo409XOGsAdy6g\ngrG10jfxsSaGMWsEd3OewsEf6DI442AdeCSFuIMAQ1WzaNPXg8bHzPFaJ3HcoxCs\nepGazcXov004YrdlBy+wZGhlabupmtsJcogWPWpA5AOIMjaO7CWyuHdnN+TSE+s2\nzgJN3A/NKQxiXt1ARLx8NFdxibJClEPKUnHvRQE4WALqK7dlWLmN4PnCxKAEB4IM\n+cj92+WDxh3yCz5BAbTyCX3zoGywKOzjUJwu72KL/HEccmhNq569nsI59DSY6GwY\nH2dJC0Y29glWU86rTSZMBusCAwEAAQ==\n-----END PUBLIC KEY-----';
        // import tested module after all mocked modules
        const { processProtectedData } = await import(
          '../../../src/lib/dataProtectorCore/processProtectedData.js'
        );

        // --- WHEN
        const res = await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          defaultWorkerpool: workerpoolAddress,
          workerpool: workerpoolAddress,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          path: 'computed.json',
          onStatusUpdate: onStatusUpdateMock,
          encryptResult: true,
          pemPrivateKey: expectedPemPrivateKey,
          waitForResult: false,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
          title: 'FETCH_ORDERS',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
          title: 'FETCH_ORDERS',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(3, {
          title: 'PUSH_REQUESTER_SECRET',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(4, {
          title: 'PUSH_REQUESTER_SECRET',
          isDone: true,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(5, {
          title: 'PUSH_ENCRYPTION_KEY',
          isDone: false,
          payload: {
            pemPublicKey: expectedPublicKey,
          },
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(6, {
          title: 'PUSH_ENCRYPTION_KEY',
          isDone: true,
          payload: {
            pemPublicKey: expectedPublicKey,
          },
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(7, {
          title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
          isDone: false,
        });
        expect(onStatusUpdateMock).toHaveBeenNthCalledWith(8, {
          title: 'REQUEST_TO_PROCESS_PROTECTED_DATA',
          isDone: true,
          payload: {
            dealId: res.dealId,
            taskId: res.taskId,
            txHash: res.txHash,
          },
        });
        expect(res.dealId).toEqual(expect.any(String));
        expect(res.taskId).toEqual(expect.any(String));
        expect(res.txHash).toEqual(expect.any(String));
        expect(res.pemPrivateKey).toBe(expectedPemPrivateKey);
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('allowDeposit', () => {
    let payableWorkerpoolAddress: string;
    const workerpoolprice = 1000;
    beforeAll(async () => {
      const workerpoolOwnerWallet = Wallet.createRandom();
      const [ethProvider, options] = getTestConfig(
        workerpoolOwnerWallet.privateKey
      );

      const iexecWorkerpoolOwner = new IExec(
        { ethProvider },
        options.iexecOptions
      );

      await setNRlcBalance(workerpoolOwnerWallet.address, 100 * 10e9);
      await iexecWorkerpoolOwner.account.deposit(100 * 10e9);
      const { address: deployedWorkerpoolAddress } =
        await iexecWorkerpoolOwner.workerpool.deployWorkerpool({
          description: 'payable test workerpool',
          owner: await iexecWorkerpoolOwner.wallet.getAddress(),
        });
      payableWorkerpoolAddress = deployedWorkerpoolAddress;

      await iexecWorkerpoolOwner.order
        .createWorkerpoolorder({
          workerpool: deployedWorkerpoolAddress,
          category: 0,
          workerpoolprice,
          volume: 1000,
          tag: ['tee', 'scone'],
        })
        .then(iexecWorkerpoolOwner.order.signWorkerpoolorder)
        .then(iexecWorkerpoolOwner.order.publishWorkerpoolorder);
    });
    it(
      'should throw error when insufficient funds and allowDeposit is false',
      async () => {
        const { processProtectedData } = await import(
          '../../../src/lib/dataProtectorCore/processProtectedData.js'
        );

        // wallet has enough nRLC
        await setNRlcBalance(wallet.address, workerpoolprice * 10e9);
        // but account has no enough funds to process the data (less than workerpoolprice)
        await iexec.account.deposit(1 * 10e9);

        let caughtError: Error | undefined;
        try {
          await processProtectedData({
            iexec,
            protectedData: protectedData.address,
            app: appAddress,
            defaultWorkerpool: payableWorkerpoolAddress,
            workerpool: payableWorkerpoolAddress,
            workerpoolMaxPrice: 100000,
            secrets: {
              1: 'ProcessProtectedData test subject',
              2: 'email content for test processData',
            },
            args: '_args_test_process_data_',
            path: 'computed.json',
            waitForResult: false,
          });
        } catch (firstError) {
          try {
            await processProtectedData({
              iexec,
              protectedData: protectedData.address,
              app: appAddress,
              defaultWorkerpool: payableWorkerpoolAddress,
              workerpool: payableWorkerpoolAddress,
              workerpoolMaxPrice: 100000,
              secrets: {
                1: 'ProcessProtectedData test subject',
                2: 'email content for test processData',
              },
              args: '_args_test_process_data_',
              path: 'computed.json',
              waitForResult: false,
            });
          } catch (secondError) {
            caughtError = secondError as Error;
          }
        }

        expect(caughtError).toBeDefined();
        expect(caughtError).toBeInstanceOf(Error);
        expect(caughtError?.message).toBe('Failed to process protected data');
        const causeMsg =
          caughtError?.errorCause?.message ||
          caughtError?.cause?.message ||
          caughtError?.cause ||
          caughtError?.errorCause;
        expect(causeMsg).toBe(
          `Cost per task (${workerpoolprice} nRlc) is greater than requester account stake (0). Orders can't be matched. If you are the requester, you should deposit to top up your account`
        );
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should process protected data when no funds are deposited and allowDeposit is true',
      async () => {
        const { processProtectedData } = await import(
          '../../../src/lib/dataProtectorCore/processProtectedData.js'
        );
        // wallet has enough nRLC but account has no funds
        await setNRlcBalance(wallet.address, workerpoolprice * 10e9);

        const walletBefore = await iexec.wallet.checkBalances(
          await iexec.wallet.getAddress()
        );
        const res = await processProtectedData({
          iexec,
          protectedData: protectedData.address,

          app: appAddress,
          defaultWorkerpool: workerpoolAddress,
          workerpool: workerpoolAddress,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          path: 'computed.json',
          waitForResult: false,
          allowDeposit: true,
        });
        const walletAfter = await iexec.wallet.checkBalances(
          await iexec.wallet.getAddress()
        );
        expect(walletAfter.nRLC.lt(walletBefore.nRLC)).toBe(true);
        expect(res.dealId).toEqual(expect.any(String));
        expect(res.taskId).toEqual(expect.any(String));
        expect(res.txHash).toEqual(expect.any(String));
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'should process protected data when insufficient funds are deposited and allowDeposit is true',
      async () => {
        const { processProtectedData } = await import(
          '../../../src/lib/dataProtectorCore/processProtectedData.js'
        );
        // wallet has enough nRLC but account has insufficient funds
        await setNRlcBalance(wallet.address, workerpoolprice * 10e9);
        await iexec.account.deposit(10 * 10e9);

        const walletBefore = await iexec.wallet.checkBalances(
          await iexec.wallet.getAddress()
        );
        const res = await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: appAddress,
          defaultWorkerpool: workerpoolAddress,
          workerpool: workerpoolAddress,
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
          path: 'computed.json',
          waitForResult: false,
          allowDeposit: true,
        });
        const walletAfter = await iexec.wallet.checkBalances(
          await iexec.wallet.getAddress()
        );
        expect(walletAfter.nRLC.lt(walletBefore.nRLC)).toBe(true);
        expect(res.dealId).toEqual(expect.any(String));
        expect(res.taskId).toEqual(expect.any(String));
        expect(res.txHash).toEqual(expect.any(String));
      },
      2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });
});
