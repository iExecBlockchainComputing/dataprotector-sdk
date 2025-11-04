import { describe, it, expect, beforeAll } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
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
import { pushRequesterSecret } from '../../../src/utils/pushRequesterSecret.js';

async function consumeProtectedDataOrder(
  iexec: IExec,
  protectedData: string,
  app: string,
  workerpool: string,
  secrets: Record<number, string>,
  args: string
) {
  const datasetOrderbook = await iexec.orderbook.fetchDatasetOrderbook({
    dataset: protectedData,
    app: app,
    requester: await iexec.wallet.getAddress(),
  });
  const datasetOrder = datasetOrderbook.orders[0]?.order;
  if (!datasetOrder) {
    throw new Error('No dataset order found');
  }

  const appOrderbook = await iexec.orderbook.fetchAppOrderbook({
    app: app,
    minTag: ['tee', 'scone'],
    maxTag: ['tee', 'scone'],
    workerpool: workerpool,
  });
  const appOrder = appOrderbook.orders[0]?.order;
  if (!appOrder) {
    throw new Error('No app order found');
  }

  const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
    workerpool: workerpool,
    app: app,
    dataset: protectedData,
    requester: await iexec.wallet.getAddress(),
    minTag: ['tee', 'scone'],
    maxTag: ['tee', 'scone'],
    category: 0,
  });
  const workerpoolOrder = workerpoolOrderbook.orders[0]?.order;
  if (!workerpoolOrder) {
    throw new Error('No workerpool order found');
  }

  const secretsId = await pushRequesterSecret(iexec, secrets);

  const requestOrder = await iexec.order.createRequestorder({
    app: app,
    category: workerpoolOrder.category,
    dataset: protectedData,
    appmaxprice: appOrder.appprice,
    datasetmaxprice: datasetOrder.datasetprice,
    workerpoolmaxprice: workerpoolOrder.workerpoolprice,
    tag: '0x0000000000000000000000000000000000000000000000000000000000000003', // SCONE_TAG
    workerpool: workerpoolOrder.workerpool,
    params: {
      iexec_input_files: [],
      iexec_secrets: secretsId,
      iexec_args: args,
    },
  });
  const signedRequestOrder = await iexec.order.signRequestorder(requestOrder);

  // Match orders to consume the dataset order (this decrements the remaining access)
  const { dealid, txHash } = await iexec.order.matchOrders({
    requestorder: signedRequestOrder,
    workerpoolorder: workerpoolOrder,
    apporder: appOrder,
    datasetorder: datasetOrder,
  });

  return { dealid, txHash };
}

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
      const [ethProvider, options] = getTestConfig(wallet.privateKey);
      sconeAppAddress = await deployRandomApp({
        ethProvider,
        teeFramework: 'scone',
      });

      iexec = new IExec({ ethProvider }, options.iexecOptions);

      // create and publish app order
      await iexec.order
        .createApporder({
          app: sconeAppAddress,
          volume: 1000,
          tag: ['tee', 'scone'],
        })
        .then(iexec.order.signApporder)
        .then(iexec.order.publishApporder);

      const { address: workerpool } = await iexec.workerpool.deployWorkerpool({
        description: 'test pool for remainingAccess',
        owner: await iexec.wallet.getAddress(),
      });
      workerpoolAddress = workerpool;

      // create and publish workerpool order
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

    describe('automatic decrementing remaining access', () => {
      it(
        'should automatically decrement remaining access from 5 to 4 when consuming one access',
        async () => {
          // create a protected data
          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test1@example.com' },
            name: 'test protected data for automatic decrementing',
          });

          const userAddress = await iexec.wallet.getAddress();

          // grant access with volume = 5
          const accessBefore = await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 5,
          });

          expect(accessBefore.remainingAccess).toBe(5);

          // consume 1 access using low-level functions (or use processProtectedDataOrder)
          await consumeProtectedDataOrder(
            iexec,
            protectedData.address,
            sconeAppAddress,
            workerpoolAddress,
            {
              1: 'requester secret 1',
              2: 'requester secret 3',
            },
            'test_args_1'
          );

          // check that iExec protocol automatically decremented remaining access to 4
          const { grantedAccess: accessAfter } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfter).toHaveLength(1);
          expect(accessAfter[0].remainingAccess).toBe(4);
        },
        15 * MAX_EXPECTED_BLOCKTIME + 2 * MAX_EXPECTED_WEB2_SERVICES_TIME
      );

      it(
        'should automatically decrement from 2 to 1 to 0, then order disappears',
        async () => {
          // create a protected data
          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test2@example.com' },
            name: 'test protected data for reaching zero',
          });

          const userAddress = await iexec.wallet.getAddress();

          // grant access with volume = 2
          await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 2,
          });

          // check initial state: 2 remaining
          const { grantedAccess: initialAccess } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(initialAccess).toHaveLength(1);
          expect(initialAccess[0].remainingAccess).toBe(2);

          // consume first access: 2 -> 1
          await consumeProtectedDataOrder(
            iexec,
            protectedData.address,
            sconeAppAddress,
            workerpoolAddress,
            {
              1: 'requester secret 1',
              2: 'requester secret 2',
            },
            'test_args_2_1'
          );

          const { grantedAccess: accessAfterFirst } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterFirst).toHaveLength(1);
          expect(accessAfterFirst[0].remainingAccess).toBe(1);

          // Consume second access: 1 -> 0, order disappears
          await consumeProtectedDataOrder(
            iexec,
            protectedData.address,
            sconeAppAddress,
            workerpoolAddress,
            {
              1: 'requester secret 1',
              2: 'requester secret 2',
            },
            'test_args_2_2'
          );

          const { grantedAccess: accessAfterSecond } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          // When remaining access reaches 0, the order is completely consumed and disappears
          expect(accessAfterSecond).toHaveLength(0);
        },
        25 * MAX_EXPECTED_BLOCKTIME + 3 * MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });

    describe('Revoking access - Complete order removal', () => {
      it(
        'should completely remaining access to 0 when revoking access',
        async () => {
          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test3@example.com' },
            name: 'test protected data for revocation',
          });

          const userAddress = await iexec.wallet.getAddress();

          // grant access with volume = 2
          const accessBeforeRevoke = await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 2,
          });

          // check initial state: 2 remaining
          const { grantedAccess: initialAccess } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(initialAccess).toHaveLength(1);
          expect(initialAccess[0].remainingAccess).toBe(2);

          // revoke one access - this completely removes the dataset order
          await dataProtectorCore.revokeOneAccess(accessBeforeRevoke);

          // check that the order no longer exists after revocation
          const { grantedAccess: accessAfterRevoke } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          // note: revokeOneAccess and revokeAllAccess do the same thing at protocol level
          // they both completely remove the dataset order, not just decrement it
          expect(accessAfterRevoke).toHaveLength(0);
        },
        25 * MAX_EXPECTED_BLOCKTIME + 3 * MAX_EXPECTED_WEB2_SERVICES_TIME
      );

      it(
        'should completely remaining access to 0 when revoking all access',
        async () => {
          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test4@example.com' },
            name: 'test protected data for revoke all',
          });

          const userAddress = await iexec.wallet.getAddress();

          // grant access with volume = 2
          await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 2,
          });

          // revoke all access - removes all dataset orders
          await dataProtectorCore.revokeAllAccess({
            protectedData: protectedData.address,
          });

          // check that no orders remain
          const { grantedAccess: accessAfterRevoke } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterRevoke).toHaveLength(0);
        },
        25 * MAX_EXPECTED_BLOCKTIME + 3 * MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });

    describe('Important notes about iExec protocol behavior', () => {
      it(
        'should demonstrate that revokeOneAccess and revokeAllAccess do the same thing',
        async () => {
          // This test demonstrates an important concept:
          // In iExec protocol, there is no partial revocation of dataset orders
          // Both revokeOneAccess and revokeAllAccess completely remove the order

          const protectedData = await dataProtectorCore.protectData({
            data: { email: 'test5@example.com' },
            name: 'test protected data for protocol behavior',
          });

          const userAddress = await iexec.wallet.getAddress();

          // Grant access with volume = 5
          await dataProtectorCore.grantAccess({
            protectedData: protectedData.address,
            authorizedApp: sconeAppAddress,
            authorizedUser: userAddress,
            numberOfAccess: 5,
          });

          // Consume 2 accesses first
          await consumeProtectedDataOrder(
            iexec,
            protectedData.address,
            sconeAppAddress,
            workerpoolAddress,
            { 1: 'Subject 1', 2: 'Content 1' },
            'args1'
          );
          await consumeProtectedDataOrder(
            iexec,
            protectedData.address,
            sconeAppAddress,
            workerpoolAddress,
            { 1: 'Subject 2', 2: 'Content 2' },
            'args2'
          );

          // Check remaining: 5 - 2 = 3
          const { grantedAccess: accessAfterConsumption } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterConsumption).toHaveLength(1);
          expect(accessAfterConsumption[0].remainingAccess).toBe(3);

          // Now revoke the remaining access
          await dataProtectorCore.revokeOneAccess(accessAfterConsumption[0]);

          // The order is completely gone, not just decremented to 2
          const { grantedAccess: accessAfterRevoke } =
            await dataProtectorCore.getGrantedAccess({
              protectedData: protectedData.address,
              authorizedApp: sconeAppAddress,
              authorizedUser: userAddress,
            });

          expect(accessAfterRevoke).toHaveLength(0);
        },
        30 * MAX_EXPECTED_BLOCKTIME + 4 * MAX_EXPECTED_WEB2_SERVICES_TIME
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

  it(
    'filters for bulk orders only when bulkOnly is true',
    async () => {
      // Create a protected data
      const protectedData = await dataProtectorCore.protectData({
        data: { email: 'bulk-test@example.com' },
        name: 'test protected data for bulk filtering',
      });

      // Deploy a SCONE app
      const sconeAppAddress = await deployRandomApp({
        ethProvider: getTestConfig(Wallet.createRandom().privateKey)[0],
        teeFramework: 'scone',
      });

      const regularUserAddress = Wallet.createRandom().address;
      const bulkUserAddress = Wallet.createRandom().address;

      // Grant regular access (non-bulk)
      await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        authorizedUser: regularUserAddress,
        numberOfAccess: 5,
        allowBulk: false,
      });

      // Grant bulk access
      await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        authorizedUser: bulkUserAddress,
        allowBulk: true,
      });

      // Test without bulkOnly filter - should return both orders
      const allAccess = await dataProtectorCore.getGrantedAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
      });
      expect(allAccess.grantedAccess.length).toBe(2);

      // Test with bulkOnly filter - should return only bulk orders
      const bulkOnlyAccess = await dataProtectorCore.getGrantedAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        bulkOnly: true,
      });
      expect(bulkOnlyAccess.grantedAccess.length).toBe(1);
      expect(bulkOnlyAccess.grantedAccess[0].volume).toBe('9007199254740991'); // Number.MAX_SAFE_INTEGER
      expect(
        bulkOnlyAccess.grantedAccess[0].requesterrestrict.toLowerCase()
      ).toBe(bulkUserAddress.toLowerCase());
    },
    4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
