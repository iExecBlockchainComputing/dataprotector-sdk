import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { IExec } from 'iexec';
import { Wallet } from 'ethers';
import { processProtectedData } from '../../dist/dataProtector/processProtectedData';
import { getWeb3Provider } from '../../dist/utils/getWeb3Provider';
import { IExecDataProtector, ProtectedDataWithSecretProps } from '../../dist';
import {
  MAX_EXPECTED_BLOCKTIME,
  MOCK_APP_ORDER,
  MOCK_DATASET_ORDER,
  MOCK_WORKERPOOL_ORDER,
} from '../test-utils';
import { WorkflowError } from '../../dist/utils/errors';
import { fetchOrdersUnderMaxPrice } from '../../dist/utils/fetchOrdersUnderMaxPrice';

describe('processProtectedData', () => {
  const wallet = Wallet.createRandom();
  let dataProtector: IExecDataProtector;
  let protectedData: ProtectedDataWithSecretProps;
  const iexec = new IExec({
    ethProvider: getWeb3Provider(wallet.privateKey),
  });

  const mockFetchWorkerpoolOrderbook: any = jest
    .fn()
    .mockImplementationOnce(() => {
      return Promise.resolve(MOCK_DATASET_ORDER);
    });
  iexec.orderbook.fetchWorkerpoolOrderbook = mockFetchWorkerpoolOrderbook;
  const mockFetchDatasetOrderbook: any = jest
    .fn()
    .mockImplementationOnce(() => {
      return Promise.resolve(MOCK_DATASET_ORDER);
    });
  iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
  const mockFetchAppOrderbook: any = jest.fn().mockImplementationOnce(() => {
    return Promise.resolve(MOCK_APP_ORDER);
  });
  iexec.orderbook.fetchAppOrderbook = mockFetchAppOrderbook;

  beforeEach(() => {
    iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
    iexec.orderbook.fetchAppOrderbook = mockFetchAppOrderbook;
    iexec.orderbook.fetchWorkerpoolOrderbook = mockFetchWorkerpoolOrderbook;
  });

  beforeAll(async () => {
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
    protectedData = await dataProtector.protectData({
      data: { email: 'example@example.com' },
      name: 'test do not use',
    });
    await dataProtector.grantAccess({
      authorizedApp: '0x4605e8af487897faaef16f0709391ef1be828591',
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
    });
  }, 5 * MAX_EXPECTED_BLOCKTIME);

  it(
    'should throw WorkflowError for missing Dataset order',
    async () => {
      const mockFetchDatasetOrderbook: any = jest
        .fn()
        .mockImplementationOnce(() => {
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
      ).rejects.toThrow(new WorkflowError('No dataset orders found'));
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should throw WorkflowError for missing App order',
    async () => {
      const mockFetchAppOrderbook: any = jest
        .fn()
        .mockImplementationOnce(() => {
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
      ).rejects.toThrow(new WorkflowError('No app orders found'));
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should throw WorkflowError for missing Workerpool order',
    async () => {
      const mockFetchWorkerpoolOrderbook: any = jest
        .fn()
        .mockImplementationOnce(() => {
          return Promise.resolve({});
        });
      iexec.orderbook.fetchWorkerpoolOrderbook = mockFetchWorkerpoolOrderbook;

      const mockFetchDatasetOrderbook: any = jest
        .fn()
        .mockImplementationOnce(() => {
          return Promise.resolve(MOCK_DATASET_ORDER);
        });
      iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
      const mockFetchAppOrderbook: any = jest
        .fn()
        .mockImplementationOnce(() => {
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
      ).rejects.toThrow(new WorkflowError('No workerpool orders found'));
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should return the first orders if maxPrice is undefined',
    () => {
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
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
});
