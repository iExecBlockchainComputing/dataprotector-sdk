import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
import BN from 'bn.js';
import { IExecDataProtectorCore } from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomApp,
  getRandomAddress,
  getTestConfig,
  getTestWeb3SignerProvider,
} from '../../test-utils.js';
import { WorkflowError } from '../../../src/index.js';
import { MarketCallError } from 'iexec/errors';

describe('dataProtectorCore.getGrantedAccess()', () => {
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
  });

  it(
    'passes with valid input',
    async () => {
      const res = await dataProtectorCore.getGrantedAccess({});
      expect(res).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'accepts an optional protectedData to filter only access to a specific protectedData',
    async () => {
      const protectedData = getRandomAddress();
      const { grantedAccess: res } = await dataProtectorCore.getGrantedAccess({
        protectedData,
      });
      expect(res).toBeDefined();
      res.forEach((grantedAccess) => {
        expect(grantedAccess.dataset).toBe(protectedData);
      });
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'accepts an optional authorizedApp to filter only access granted to a specific app (including wildcards access)',
    async () => {
      const authorizedApp = getRandomAddress();
      const { grantedAccess: res } = await dataProtectorCore.getGrantedAccess({
        authorizedApp,
      });
      expect(res).toBeDefined();
      res.forEach((grantedAccess) => {
        expect(
          grantedAccess.apprestrict === authorizedApp ||
            grantedAccess.apprestrict ===
              '0x0000000000000000000000000000000000000000'
        ).toBe(true);
      });
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'accepts an optional authorizedUser to filter only access granted to a specific user (including wildcards access)',
    async () => {
      const authorizedUser = getRandomAddress();
      const { grantedAccess: res } = await dataProtectorCore.getGrantedAccess({
        authorizedUser,
      });
      expect(res).toBeDefined();
      expect(res).toBeDefined();
      res.forEach((grantedAccess) => {
        expect(
          grantedAccess.requesterrestrict === authorizedUser ||
            grantedAccess.requesterrestrict ===
              '0x0000000000000000000000000000000000000000'
        ).toBe(true);
      });
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should correctly create a protectedData, grant access, and fetch access for protected data',
    async () => {
      const userWalletAddress = Wallet.createRandom().address;
      const [protectedData, sconeAppAddress] = await Promise.all([
        dataProtectorCore.protectData({
          data: { doNotUse: 'test' },
        }),
        deployRandomApp({
          ethProvider: getTestConfig(Wallet.createRandom().privateKey)[0],
          teeFramework: 'scone',
        }),
      ]);
      const grantedAccess = await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        authorizedUser: userWalletAddress,
      });
      const { grantedAccess: fetchedContacts } =
        await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          authorizedUser: userWalletAddress,
        });
      const result = fetchedContacts.filter(
        (contact) =>
          contact.apprestrict.toLowerCase() === sconeAppAddress.toLowerCase() &&
          contact.requesterrestrict.toLowerCase() ===
            userWalletAddress.toLowerCase()
      );
      expect(result[0]).toEqual(grantedAccess);
    },
    4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  describe('pagination', () => {
    async function grantAccessToRandomUsers(
      protectedData,
      sconeAppAddress,
      count
    ) {
      for (let i = 0; i < count; i++) {
        const userWalletAddress = Wallet.createRandom().address;
        await dataProtectorCore.grantAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          authorizedUser: userWalletAddress,
        });
      }
    }

    const grantedAccessCount = 42;
    let protectedData;
    let sconeAppAddress;

    beforeAll(async () => {
      [protectedData, sconeAppAddress] = await Promise.all([
        dataProtectorCore.protectData({
          data: { doNotUse: 'pagination test' },
        }),
        deployRandomApp({
          ethProvider: getTestConfig(Wallet.createRandom().privateKey)[0],
          teeFramework: 'scone',
        }),
      ]);

      await grantAccessToRandomUsers(
        protectedData,
        sconeAppAddress,
        grantedAccessCount
      );
    }, (grantedAccessCount + 2) * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

    it(
      'returns the first page with 20 elements (default pageSize) when page and pageSize not specified',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
        });
        expect(grantedAccessResponse.count).toBe(grantedAccessCount);
        expect(grantedAccessResponse.grantedAccess.length).toBe(20);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns 20 elements (default pageSize) of granted access only for specified page',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 1,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBeLessThanOrEqual(
          20
        );
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns the remaining elements at the end if it is the last page',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 2,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBeLessThanOrEqual(
          2
        );
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns specified number of elements per page (first granted access)',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          pageSize: 13,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBe(13);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns granted access for specified page and pageSize',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 0,
          pageSize: 15,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBe(15);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );

    it(
      'returns no granted access for non-existent page',
      async () => {
        const grantedAccessResponse = await dataProtectorCore.getGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          page: 100,
          pageSize: 20,
        });
        expect(grantedAccessResponse.grantedAccess.length).toBe(0);
      },
      MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('remainingAccess', () => {
    let iexec: IExec;
    let sconeAppAddress: string;
    let workerpoolAddress: string;

    beforeAll(async () => {
      // Setup app and workerpool for processing
      const [ethProvider, options] = getTestConfig(wallet.privateKey);
      sconeAppAddress = await deployRandomApp({
        ethProvider,
        teeFramework: 'scone',
      });

      iexec = new IExec({ ethProvider }, options.iexecOptions);

      // Create and publish app order
      await iexec.order
        .createApporder({
          app: sconeAppAddress,
          volume: 1000,
          tag: ['tee', 'scone'],
        })
        .then(iexec.order.signApporder)
        .then(iexec.order.publishApporder);

      // Deploy workerpool
      const { address: workerpool } = await iexec.workerpool.deployWorkerpool({
        description: 'test pool for remainingAccess',
        owner: await iexec.wallet.getAddress(),
      });
      workerpoolAddress = workerpool;

      // Create and publish workerpool order
      await iexec.order
        .createWorkerpoolorder({
          workerpool: workerpoolAddress,
          category: 0,
          volume: 1000,
          tag: ['tee', 'scone'],
        })
        .then(iexec.order.signWorkerpoolorder)
        .then(iexec.order.publishWorkerpoolorder);
    }, 6 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

    describe('Basic decrementing', () => {
      it(
        'should show 5 remaining access before sending any email, then 4 after processing once',
        async () => {
          // Create a protected data
          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test1@example.com' },
            name: 'test protected data for decrementing',
          });

          const userAddress = await iexec.wallet.getAddress();

          // Grant access to yourself with volume = 5
          const accessBefore = await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 5,
          });

          expect(accessBefore).toBeDefined();
          expect(accessBefore.remainingAccess).toBe(5);

          // Mock the task processing to avoid actual execution but simulate consumption
          const mockTaskObservable = {
            subscribe: ({ complete }) => {
              if (complete) {
                setTimeout(() => {
                  complete();
                }, 100); // Simulate some processing time
              }
              return () => {};
            },
          };

          jest
            .spyOn(iexec.task, 'obsTask')
            .mockResolvedValue(mockTaskObservable as any);
          jest
            .spyOn(iexec.deal, 'computeTaskId')
            .mockResolvedValue('0x123...taskid');

          // Mock the order matching to simulate successful order consumption
          const mockMatchResult = {
            dealid: '0x123...dealid',
            txHash: '0x123...txhash',
            volume: new BN(1),
          };
          jest
            .spyOn(iexec.order, 'matchOrders')
            .mockResolvedValue(mockMatchResult);

          // Send 1 email (process the protected data)
          try {
            await dataProtectorCore.processProtectedData({
              protectedData: protectedData.address,
              app: sconeAppAddress,
              workerpool: workerpoolAddress,
              secrets: {
                1: 'Test email subject',
                2: 'Test email content',
              },
              args: 'test_args',
            });
          } catch (error) {
            // We expect this to fail due to mocking, but the order should still be consumed
            console.log(
              'Expected processing error due to mocking:',
              error.message
            );
          }

          // Check that remaining access shows 4 (not 5)
          const { grantedAccess: accessAfter } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfter).toHaveLength(1);
          expect(accessAfter[0].remainingAccess).toBe(4);

          // Restore mocks
          jest.restoreAllMocks();
        },
        15 * MAX_EXPECTED_BLOCKTIME + 2 * MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });

    describe('Re-granting access', () => {
      it(
        'should add up remaining access when granting access multiple times',
        async () => {
          // Create a protected data
          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test2@example.com' },
            name: 'test protected data for re-granting',
          });

          const userAddress = await iexec.wallet.getAddress();

          // Grant access to yourself with volume = 5
          await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 5,
          });

          // Mock and process 1 email
          const mockTaskObservable = {
            subscribe: ({ complete }) => {
              if (complete) {
                if (complete) {
                  setTimeout(() => {
                    complete();
                  }, 100); // Simulate some processing time
                }
              }
              return () => {};
            },
          };

          jest
            .spyOn(iexec.task, 'obsTask')
            .mockResolvedValue(mockTaskObservable as any);
          jest
            .spyOn(iexec.deal, 'computeTaskId')
            .mockResolvedValue('0x124...taskid');
          jest.spyOn(iexec.order, 'matchOrders').mockResolvedValue({
            dealid: '0x124...dealid',
            txHash: '0x124...txhash',
            volume: new BN(1),
          });

          try {
            await dataProtectorCore.processProtectedData({
              protectedData: protectedData.address,
              app: sconeAppAddress,
              workerpool: workerpoolAddress,
              secrets: {
                1: 'Test email subject 2',
                2: 'Test email content 2',
              },
              args: 'test_args_2',
            });
          } catch (error) {
            console.log(
              'Expected processing error due to mocking:',
              error.message
            );
          }

          // Check that remaining access shows 4
          const { grantedAccess: accessAfterFirstEmail } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterFirstEmail).toHaveLength(1);
          expect(accessAfterFirstEmail[0].remainingAccess).toBe(4);

          // Grant access again with volume = 5
          await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 5,
          });

          // Check that remaining access shows 9 (4 + 5)
          const { grantedAccess: accessAfterReGrant } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterReGrant).toHaveLength(1);
          expect(accessAfterReGrant[0].remainingAccess).toBe(9);

          jest.restoreAllMocks();
        },
        18 * MAX_EXPECTED_BLOCKTIME + 2 * MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });

    describe('Reaching zero', () => {
      it(
        'should correctly decrement from 2 to 1 to 0 remaining access',
        async () => {
          // Create a protected data
          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test3@example.com' },
            name: 'test protected data for reaching zero',
          });

          const userAddress = await iexec.wallet.getAddress();

          // Grant access to yourself with volume = 2
          await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 2,
          });

          // Check initial state: should show 2 remaining
          const { grantedAccess: initialAccess } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(initialAccess).toHaveLength(1);
          expect(initialAccess[0].remainingAccess).toBe(2);

          // Mock task processing
          const mockTaskObservable = {
            subscribe: ({ complete }) => {
              if (complete) {
                setTimeout(() => {
                  complete();
                }, 100); // Simulate some processing time
              }
              return () => {};
            },
          };

          jest
            .spyOn(iexec.task, 'obsTask')
            .mockResolvedValue(mockTaskObservable as any);
          jest
            .spyOn(iexec.deal, 'computeTaskId')
            .mockResolvedValue('0x125...taskid');

          // Send first email
          jest.spyOn(iexec.order, 'matchOrders').mockResolvedValue({
            dealid: '0x125...dealid',
            txHash: '0x125...txhash',
            volume: new BN(1),
          });

          try {
            await dataProtectorCore.processProtectedData({
              protectedData: protectedData.address,
              app: sconeAppAddress,
              workerpool: workerpoolAddress,
              secrets: {
                1: 'Test email subject 3-1',
                2: 'Test email content 3-1',
              },
              args: 'test_args_3_1',
            });
          } catch (error) {
            console.log(
              'Expected processing error due to mocking:',
              error.message
            );
          }

          // After email 1: should show 1 remaining
          const { grantedAccess: accessAfterFirst } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterFirst).toHaveLength(1);
          expect(accessAfterFirst[0].remainingAccess).toBe(1);

          // Send second email
          jest.spyOn(iexec.order, 'matchOrders').mockResolvedValue({
            dealid: '0x126...dealid',
            txHash: '0x126...txhash',
            volume: new BN(1),
          });

          try {
            await dataProtectorCore.processProtectedData({
              protectedData: protectedData.address,
              app: sconeAppAddress,
              workerpool: workerpoolAddress,
              secrets: {
                1: 'Test email subject 3-2',
                2: 'Test email content 3-2',
              },
              args: 'test_args_3_2',
            });
          } catch (error) {
            console.log(
              'Expected processing error due to mocking:',
              error.message
            );
          }

          // After email 2: should show 0 remaining
          const { grantedAccess: accessAfterSecond } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterSecond).toHaveLength(1);
          expect(accessAfterSecond[0].remainingAccess).toBe(0);

          jest.restoreAllMocks();
        },
        25 * MAX_EXPECTED_BLOCKTIME + 3 * MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });
  });

  it(
    'Throws error when the marketplace is unavailable',
    async () => {
      const unavailableDataProtector = new IExecDataProtectorCore(
        getTestWeb3SignerProvider(wallet.privateKey),
        {
          iexecOptions: {
            iexecGatewayURL: 'https://unavailable.market.url',
          },
        }
      );
      let error: WorkflowError | undefined;
      try {
        await unavailableDataProtector.getGrantedAccess({});
      } catch (e) {
        error = e as WorkflowError;
      }
      expect(error).toBeInstanceOf(WorkflowError);
      expect(error.message).toBe(
        "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help."
      );
      expect(error.cause).toStrictEqual(
        new MarketCallError(
          'Connection to https://unavailable.market.url failed with a network error',
          Error('')
        )
      );
      expect(error.isProtocolError).toBe(true);
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
