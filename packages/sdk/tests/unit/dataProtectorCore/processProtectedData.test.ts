import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Wallet } from 'ethers';
import { IExec } from 'iexec';
import {
  IExecDataProtectorCore,
  ProtectedDataWithSecretProps,
} from '../../../src/index.js';
import { processProtectedData } from '../../../src/lib/dataProtectorCore/processProtectedData.js';
import { WorkflowError,processProtectedDataErrorMessage } from '../../../src/utils/errors.js';
import { fetchOrdersUnderMaxPrice } from '../../../src/utils/fetchOrdersUnderMaxPrice.js';
import { getWeb3Provider } from '../../../src/utils/getWeb3Provider.js';
import {
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
      return Promise.resolve(MOCK_DATASET_ORDER);
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
        return Promise.resolve({});
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
      ).rejects.toThrow(new WorkflowError({message:processProtectedDataErrorMessage, errorCause: Error('No dataset orders found')}));
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should throw WorkflowError for missing App order',
    async () => {
      mockFetchAppOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({});
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
      ).rejects.toThrow(new WorkflowError({message: processProtectedDataErrorMessage, errorCause: Error('No app orders found')}));
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
  it(
    'should throw WorkflowError for missing Workerpool order',
    async () => {
      mockFetchWorkerpoolOrderbook = jest.fn().mockImplementationOnce(() => {
        return Promise.resolve({});
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
      ).rejects.toThrow(new WorkflowError({message:processProtectedDataErrorMessage, errorCause: Error('No workerpool orders found')}));
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
        new WorkflowError({message: processProtectedDataErrorMessage, errorCause: Error(
          `secrets must be a \`object\` type, but the final value was: \`\"${secretsValue}\"\`.`
        )})
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
