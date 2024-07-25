import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ethers, Wallet, Contract } from 'ethers';
import { IExec } from 'iexec';
import { SCONE_TAG, WORKERPOOL_ADDRESS } from '../../../src/config/config.js';
import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '../../../src/index.js';
import { processProtectedData } from '../../../src/lib/dataProtectorCore/processProtectedData.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
} from '../../../src/utils/errors.js';
import { fetchOrdersUnderMaxPrice } from '../../../src/utils/fetchOrdersUnderMaxPrice.js';
import { getWeb3Provider } from '../../../src/utils/getWeb3Provider.js';
import {
  EMPTY_ORDER_BOOK,
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  MOCK_APP_ORDER,
  MOCK_DATASET_ORDER,
  MOCK_WORKERPOOL_ORDER,
} from '../../test-utils.js';

describe('processProtectedData', () => {
  const wallet = Wallet.createRandom();
  let dataProtectorCore: IExecDataProtectorCore;
  let protectedData: ProtectedDataWithSecretProps;
  let mockFetchWorkerpoolOrderbook: any;
  let mockFetchDatasetOrderbook: any;
  let mockFetchAppOrderbook: any;
  let iexec: IExec;

  beforeAll(async () => {
    iexec = new IExec({
      ethProvider: getWeb3Provider(wallet.privateKey),
    });
    dataProtectorCore = new IExecDataProtectorCore(
      getWeb3Provider(wallet.privateKey)
    );
    protectedData = await dataProtectorCore.protectData({
      data: { email: 'example@example.com' },
      name: 'test do not use',
    });
    await dataProtectorCore.grantAccess({
      authorizedApp: '0x4605e8af487897faaef16f0709391ef1be828591',
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  beforeEach(() => {
    mockFetchWorkerpoolOrderbook = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve(MOCK_WORKERPOOL_ORDER);
    });
    mockFetchDatasetOrderbook = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve(MOCK_DATASET_ORDER);
    });
    mockFetchAppOrderbook = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve(MOCK_APP_ORDER);
    });
    iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
    iexec.orderbook.fetchAppOrderbook = mockFetchAppOrderbook;
    iexec.orderbook.fetchWorkerpoolOrderbook = mockFetchWorkerpoolOrderbook;
  });

  it(
    'should throw WorkflowError for missing Dataset order',
    async () => {
      mockFetchDatasetOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(EMPTY_ORDER_BOOK);
      });
      iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
      await expect(
        processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: '0x4605e8af487897faaef16f0709391ef1be828591',
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error('No dataset orders found'),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should throw an Error if an invalid Whitelist contract is set',
    async () => {
      await expect(
        dataProtectorCore.processProtectedData({
          protectedData: protectedData.address,
          app: '0x4605e8af487897faaef16f0709391ef1be828591',
          userWhitelist: Wallet.createRandom().address,
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to process protected data',
          errorCause: Error(
            "The Whitelist is not valid whitelist contract. It seems the whitelist doesn't respect the IERC734 interface"
          ),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should call fetchDatasetOrderbook with the whitelist address for the requester param',
    async () => {
      // this contract is not ownable, it's just for testing in order to enable anyone to add address into it
      const validWhitelistAddress =
        '0x267838946a320d310b062eeeb1bd601646ddd8d1';
      const app = Wallet.createRandom().address.toLowerCase(); // invalid App Address

      // add the requester into the whitelist
      const ABI = [
        {
          inputs: [
            {
              internalType: 'address',
              name: 'resource',
              type: 'address',
            },
          ],
          name: 'addResourceToWhitelist',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ];
      const { signer } = await iexec.config.resolveContractsClient();
      const contract = new Contract(validWhitelistAddress, ABI, signer);
      await contract
        .addResourceToWhitelist(validWhitelistAddress)
        .then((tx) => tx.wait());

      try {
        await processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app,
          userWhitelist: validWhitelistAddress,
        });
      } catch (e) {
        // Error caught, but not logged
      }
      expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
        1,
        protectedData.address.toLowerCase(),
        {
          app,
          workerpool: WORKERPOOL_ADDRESS,
          requester: validWhitelistAddress,
        }
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should throw WorkflowError for missing App order',
    async () => {
      mockFetchAppOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(EMPTY_ORDER_BOOK);
      });

      iexec.orderbook.fetchAppOrderbook = mockFetchAppOrderbook;
      await expect(
        processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: '0x4605e8af487897faaef16f0709391ef1be828591',
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error('No app orders found'),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'should throw WorkflowError for missing Workerpool order',
    async () => {
      mockFetchWorkerpoolOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(EMPTY_ORDER_BOOK);
      });
      iexec.orderbook.fetchWorkerpoolOrderbook = mockFetchWorkerpoolOrderbook;

      mockFetchDatasetOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(MOCK_DATASET_ORDER);
      });
      iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
      mockFetchAppOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve(MOCK_APP_ORDER);
      });
      iexec.orderbook.fetchAppOrderbook = mockFetchAppOrderbook;
      await expect(
        processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: '0x4605e8af487897faaef16f0709391ef1be828591',
          secrets: {
            1: 'ProcessProtectedData test subject',
            2: 'email content for test processData',
          },
          args: '_args_test_process_data_',
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error('No workerpool orders found'),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it('should return the first orders if maxPrice is undefined', () => {
    const maxPrice = undefined;
    const result = fetchOrdersUnderMaxPrice(
      MOCK_DATASET_ORDER,
      MOCK_APP_ORDER,
      MOCK_WORKERPOOL_ORDER,
      maxPrice
    );
    expect(result).toEqual({
      datasetorder: MOCK_DATASET_ORDER.orders[0]?.order,
      apporder: MOCK_APP_ORDER.orders[0]?.order,
      workerpoolorder: MOCK_WORKERPOOL_ORDER.orders[0]?.order,
    });
  });

  it(
    'should throw WorkflowError for invalid secret type',
    async () => {
      mockFetchDatasetOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({});
      });
      iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
      const secretsValue = 'invalid value';
      await expect(
        processProtectedData({
          iexec,
          protectedData: protectedData.address,
          app: '0x4605e8af487897faaef16f0709391ef1be828591',
          secrets: secretsValue,
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error(
            `secrets must be a \`object\` type, but the final value was: \`\"${secretsValue}\"\`.`
          ),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  // Skipped
  // Spend more time to correctly mock getResultFromCompletedTask()
  it.skip(
    "should call the market API with 'any' if no workerpool is specified",
    async () => {
      // Mock MatchOrders & ComputeTaskId
      const mockFunction: any = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({});
      });
      iexec.order.matchOrders = mockFunction;
      iexec.deal.computeTaskId = mockFunction;

      // Mock ObsTask
      const mockObservable: any = {
        subscribe: jest.fn(({ complete }) => {
          // Call complete immediately to resolve the promise
          complete();
        }),
      };
      // @ts-expect-error Fix mockObservable type?
      const mockObsTask: any = jest.fn().mockResolvedValue(mockObservable);
      iexec.task.obsTask = mockObsTask;

      // Mock getResultFromCompletedTask => I don't know how to do that. I'm not sure it's possible. Cf ticket mock consumeProtectedData in the backlog
      // TODO

      const app = '0x4605e8af487897faaef16f0709391ef1be828591';
      await processProtectedData({
        iexec,
        protectedData: protectedData.address,
        app: app,
        workerpool: ethers.ZeroAddress,
      });

      expect(iexec.orderbook.fetchWorkerpoolOrderbook).toHaveBeenNthCalledWith(
        1,
        {
          workerpool: 'any',
          app: app,
          dataset: protectedData.address.toLowerCase(),
          minTag: SCONE_TAG,
          maxTag: SCONE_TAG,
        }
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
