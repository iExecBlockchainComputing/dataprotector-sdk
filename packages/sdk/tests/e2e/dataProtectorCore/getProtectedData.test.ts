import { beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtectorCore } from '../../../src/index.js';
import { ValidationError } from '../../../src/utils/errors.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { waitForSubgraphIndexing } from '../../utils/waitForSubgraphIndexing.js';

describe('dataProtectorCore.getProtectedData()', () => {
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
  });

  it(
    'pass with valid input',
    async () => {
      const res = await dataProtectorCore.getProtectedData();
      expect(res).toBeDefined();
    },
    timeouts.getProtectedData
  );

  it(
    'accept an optional requiredSchema',
    async () => {
      const res = await dataProtectorCore.getProtectedData({
        requiredSchema: { foo: 'string' },
      });
      expect(res).toBeDefined();
    },
    timeouts.getProtectedData
  );

  it(
    'accept an array of possible types in requiredSchema',
    async () => {
      const res = await dataProtectorCore.getProtectedData({
        requiredSchema: {
          assets: { image: ['image/bmp', 'image/jpeg'] },
          name: 'string',
        },
      });
      expect(res).toBeDefined();
    },
    timeouts.getProtectedData
  );

  it(
    'accept an optional owner (address)',
    async () => {
      const res = await dataProtectorCore.getProtectedData({
        owner: '0x027740b43e632439f100301d111d5c6954675235',
      });
      expect(res).toBeDefined();
    },
    timeouts.getProtectedData
  );

  it(
    'accept an optional owner (ENS)',
    async () => {
      const res = await dataProtectorCore.getProtectedData({
        owner: 'pierre.users.iexec.eth',
      });
      expect(res).toBeDefined();
    },
    timeouts.getProtectedData
  );

  it('checks the owner ENS is valid', async () => {
    await expect(
      dataProtectorCore.getProtectedData({
        owner: 'this.ens.does.not.exist.eth',
      })
    ).rejects.toThrow(
      new ValidationError('ENS name is not valid: this.ens.does.not.exist.eth')
    );
  });

  describe('When calling getProtectedData with a specific protectedDataAddress', () => {
    it(
      'should return only this protectedData',
      async () => {
        // --- GIVEN
        const createdProtectedData = await dataProtectorCore.protectData({
          data: { email: 'example@example.com' },
          name: 'test getProtectedData',
        });
        await waitForSubgraphIndexing();

        // --- WHEN
        const result = await dataProtectorCore.getProtectedData({
          protectedDataAddress: createdProtectedData.address,
        });

        // --- THEN
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual('test getProtectedData');
      },
      timeouts.protectData + timeouts.getProtectedData
    );

    describe('When calling getProtectedData for a ProtectedData that contains nested JSON objects possibly empty', () => {
      it('should return the protectedData without the field corresponding to the nested empty JSON objects', async () => {
        // --- GIVEN
        const data = {
          n8nWorkflow: {
            credentials: {
              '0': {
                createdAt: 'string',
                updatedAt: 'string',
                id: 'string',
                name: 'string',
                data: {
                  accessToken: 'string',
                },
                type: 'string',
                isManaged: false,
              },
            },
            workflows: {
              '0': {
                createdAt: 'string',
                updatedAt: 'string',
                id: 'string',
                name: 'string',
                active: false,
                isArchived: false,
                nodes: {
                  '0': {
                    parameters: {
                      select: 'string',
                      channelId: {
                        __rl: false,
                        value: 'string',
                        mode: 'string',
                      },
                      text: 'string',
                      otherOptions: {
                        includeLinkToWorkflow: false,
                      },
                    },
                    type: 'string',
                    typeVersion: 1,
                    position: {
                      '0': 1,
                      '1': 1,
                    },
                    id: 'string',
                    name: 'string',
                    webhookId: 'string',
                    credentials: {
                      slackApi: {
                        id: 'string',
                        name: 'string',
                      },
                    },
                  },
                  '1': {
                    parameters: {
                      operation: 'string',
                      date: 'string',
                      format: 'string',
                      customFormat: 'string',
                      options: {},
                    },
                    type: 'string',
                    typeVersion: 1,
                    position: {
                      '0': 1,
                      '1': 1,
                    },
                    id: 'string',
                    name: 'string',
                  },
                  '2': {
                    parameters: {
                      rule: {
                        interval: {
                          '0': {
                            field: 'string',
                            minutesInterval: 1,
                          },
                        },
                      },
                    },
                    type: 'string',
                    typeVersion: 1,
                    position: {
                      '0': 1,
                      '1': 1,
                    },
                    id: 'string',
                    name: 'string',
                  },
                  '3': {
                    parameters: {},
                    type: 'string',
                    typeVersion: 1,
                    position: {
                      '0': 1,
                      '1': 1,
                    },
                    id: 'string',
                    name: 'string',
                  },
                },
                connections: {
                  Date___Time: {
                    main: {
                      '0': {
                        '0': {
                          node: 'string',
                          type: 'string',
                          index: 1,
                        },
                      },
                    },
                  },
                  Schedule_Trigger: {
                    main: {
                      '0': {
                        '0': {
                          node: 'string',
                          type: 'string',
                          index: 1,
                        },
                      },
                    },
                  },
                  When_clicking__Execute_workflow_: {
                    main: {
                      '0': {
                        '0': {
                          node: 'string',
                          type: 'string',
                          index: 1,
                        },
                      },
                    },
                  },
                },
                settings: {
                  executionOrder: 'string',
                  timezone: 'string',
                  callerPolicy: 'string',
                },
                staticData: {
                  node_Schedule_Trigger: {
                    recurrenceRules: {},
                  },
                },
                meta: {
                  templateCredsSetupCompleted: false,
                },
                pinData: {},
                versionId: 'string',
                triggerCount: 1,
                tags: {},
              },
            },
          },
        };
        const expectedSchema = {
          n8nWorkflow: {
            credentials: {
              '0': {
                createdAt: 'string',
                updatedAt: 'string',
                id: 'string',
                name: 'string',
                data: {
                  accessToken: 'string',
                },
                type: 'string',
                isManaged: 'bool',
              },
            },
            workflows: {
              '0': {
                createdAt: 'string',
                updatedAt: 'string',
                id: 'string',
                name: 'string',
                active: 'bool',
                isArchived: 'bool',
                nodes: {
                  '0': {
                    parameters: {
                      select: 'string',
                      channelId: {
                        __rl: 'bool',
                        value: 'string',
                        mode: 'string',
                      },
                      text: 'string',
                      otherOptions: {
                        includeLinkToWorkflow: 'bool',
                      },
                    },
                    type: 'string',
                    typeVersion: 'f64',
                    position: {
                      '0': 'f64',
                      '1': 'f64',
                    },
                    id: 'string',
                    name: 'string',
                    webhookId: 'string',
                    credentials: {
                      slackApi: {
                        id: 'string',
                        name: 'string',
                      },
                    },
                  },
                  '1': {
                    parameters: {
                      operation: 'string',
                      date: 'string',
                      format: 'string',
                      customFormat: 'string',
                      // options: {}, // should be stripped
                    },
                    type: 'string',
                    typeVersion: 'f64',
                    position: {
                      '0': 'f64',
                      '1': 'f64',
                    },
                    id: 'string',
                    name: 'string',
                  },
                  '2': {
                    parameters: {
                      rule: {
                        interval: {
                          '0': {
                            field: 'string',
                            minutesInterval: 'f64',
                          },
                        },
                      },
                    },
                    type: 'string',
                    typeVersion: 'f64',
                    position: {
                      '0': 'f64',
                      '1': 'f64',
                    },
                    id: 'string',
                    name: 'string',
                  },
                  '3': {
                    // parameters: {}, // should be stripped
                    type: 'string',
                    typeVersion: 'f64',
                    position: {
                      '0': 'f64',
                      '1': 'f64',
                    },
                    id: 'string',
                    name: 'string',
                  },
                },
                connections: {
                  Date___Time: {
                    main: {
                      '0': {
                        '0': {
                          node: 'string',
                          type: 'string',
                          index: 'f64',
                        },
                      },
                    },
                  },
                  Schedule_Trigger: {
                    main: {
                      '0': {
                        '0': {
                          node: 'string',
                          type: 'string',
                          index: 'f64',
                        },
                      },
                    },
                  },
                  When_clicking__Execute_workflow_: {
                    main: {
                      '0': {
                        '0': {
                          node: 'string',
                          type: 'string',
                          index: 'f64',
                        },
                      },
                    },
                  },
                },
                settings: {
                  executionOrder: 'string',
                  timezone: 'string',
                  callerPolicy: 'string',
                },
                // staticData: {
                //   node_Schedule_Trigger: {
                //     recurrenceRules: {}, // should be stripped
                //   },
                // },
                meta: {
                  templateCredsSetupCompleted: 'bool',
                },
                // pinData: {}, // should be stripped
                versionId: 'string',
                triggerCount: 'f64',
                // tags: {}, // should be stripped
              },
            },
          },
        };

        const createdProtectedData = await dataProtectorCore.protectData({
          data,
          name: 'test getProtectedData',
        });
        await waitForSubgraphIndexing();

        // --- WHEN
        const result = await dataProtectorCore.getProtectedData({
          protectedDataAddress: createdProtectedData.address,
        });

        // --- THEN
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual('test getProtectedData');
        expect(result[0].schema).toStrictEqual(expectedSchema);
      });
    });
  });

  describe('When calling getProtectedData with a specific owner', () => {
    it(
      "should return only this owner's protectedData",
      async () => {
        // --- GIVEN
        await dataProtectorCore.protectData({
          data: { email: 'example@example.com' },
          name: 'test getProtectedData 1',
        });
        await dataProtectorCore.protectData({
          data: { email: 'example@example.com' },
          name: 'test getProtectedData 2',
        });

        await waitForSubgraphIndexing();

        // --- WHEN
        const result = await dataProtectorCore.getProtectedData({
          owner: wallet.address,
        });

        // --- THEN
        expect(result.length).toEqual(2);
        expect(result[0].owner).toEqual(wallet.address.toLowerCase());
        expect(result[1].owner).toEqual(wallet.address.toLowerCase());
      },
      2 * timeouts.protectData + timeouts.getProtectedData
    );
  });

  describe('When calling getProtectedData with a specific requiredSchema', () => {
    const ownerWallet = Wallet.createRandom();
    beforeAll(async () => {
      dataProtectorCore = new IExecDataProtectorCore(
        ...getTestConfig(ownerWallet.privateKey)
      );
      await dataProtectorCore.protectData({
        name: 'bool',
        data: { secret: { value: true } },
      });
      await dataProtectorCore.protectData({
        name: 'f64',
        data: { secret: { value: 1 } },
      });
      await dataProtectorCore.protectData({
        name: 'i128',
        data: { secret: { value: BigInt(1) } },
      });
      await dataProtectorCore.protectData({
        name: 'i128+string',
        data: { secret: { value: BigInt(1), string: 'foo' } },
      });
      await waitForSubgraphIndexing();
    }, 4 * timeouts.protectData);

    it(
      'should return only protected data matching requiredSchema',
      async () => {
        // --- GIVEN
        // beforeAll setup

        // --- WHEN
        const result = await dataProtectorCore.getProtectedData({
          owner: ownerWallet.address,
          requiredSchema: { secret: { value: 'bool' } },
        });

        // --- THEN
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual('bool');
      },
      timeouts.getProtectedData
    );

    it(
      'should return only protected data matching any requiredSchema in a any of type array',
      async () => {
        // --- GIVEN
        // beforeAll setup

        // --- WHEN
        const result = await dataProtectorCore.getProtectedData({
          owner: ownerWallet.address,
          requiredSchema: { secret: { value: 'i128', string: 'string' } },
        });

        // --- THEN
        expect(result.length).toEqual(1);
        expect(result[0].name).toEqual('i128+string');
      },
      timeouts.getProtectedData
    );

    it(
      'should return only protected data matching all requiredSchema',
      async () => {
        // --- GIVEN
        // beforeAll setup

        // --- WHEN
        const result = await dataProtectorCore.getProtectedData({
          owner: ownerWallet.address,
          requiredSchema: { secret: { value: ['bool', 'f64'] } },
        });

        // --- THEN
        expect(result.length).toEqual(2);
        expect(result[0].name).toBe('f64');
        expect(result[1].name).toBe('bool');
      },
      timeouts.getProtectedData
    );
  });

  it(
    'pagination: fetches the first 1000 items by default',
    async () => {
      const res = await dataProtectorCore.getProtectedData();
      expect(res.length).toBeLessThanOrEqual(1000);
    },
    timeouts.getProtectedData
  );

  it(
    'pagination: fetches a specific page with a specified page size',
    async () => {
      const total = await dataProtectorCore.getProtectedData();
      if (total.length < 150) {
        // Not enough protected data, skip the test
        // eslint-disable-next-line jest/no-conditional-expect
        return expect(true).toBe(true);
      }

      const page = 2; // Specify the desired page number
      const pageSize = 50; // Specify the desired page size
      const res = await dataProtectorCore.getProtectedData({ page, pageSize });

      // Check if the correct number of items for the specified page size is retrieved
      expect(res.length).toBe(50);

      const res2ToCheck = await dataProtectorCore.getProtectedData({
        page: 0,
        pageSize: 150,
      });
      expect(res[49]).toEqual(res2ToCheck[149]);
    },
    3 * timeouts.getProtectedData
  );

  it(
    'pagination: handles large page numbers correctly',
    async () => {
      const page = 10000; // Large page number
      const pageSize = 50; // Specify a valid page size
      const res = await dataProtectorCore.getProtectedData({ page, pageSize });

      // Check if the response is empty
      expect(res).toStrictEqual([]);
    },
    timeouts.getProtectedData
  );
});
