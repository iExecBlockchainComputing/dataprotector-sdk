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
import { MAX_EXPECTED_BLOCKTIME } from '../test-utils';
import { WorkflowError } from '../../dist/utils/errors';
import { fetchOrdersUnderMaxPrice } from '../../dist/utils/fetchOrdersUnderMaxPrice';

const TEST_PRIVATE_KEY =
  '0x3d2d3e630df6f837644bfbf801fb3b0ecedc040c72736d16f56e2af85f988318';

const MOCK_DATASET_ORDER = {
  orders: [
    {
      order: {
        dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
        datasetprice: 10,
        volume: 10,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        apprestrict: '0x0000000000000000000000000000000000000000',
        workerpoolrestrict: '0x0000000000000000000000000000000000000000',
        requesterrestrict: '0x0000000000000000000000000000000000000000',
        salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
        sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
      },
      orderHash:
        '0x396392835c2cbe933023dd28a3d6eedceb21c52b1dba199835a6f24cc75e7685',
      chainId: 134,
      publicationTimestamp: '2023-06-15T16:39:22.713Z',
      signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
      status: 'open',
      remaining: 10,
    },
    {
      order: {
        dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
        datasetprice: 0,
        volume: 10,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        apprestrict: '0x0000000000000000000000000000000000000000',
        workerpoolrestrict: '0x0000000000000000000000000000000000000000',
        requesterrestrict: '0x0000000000000000000000000000000000000000',
        salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
        sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
      },
      orderHash:
        '0x396392835c2cbe933023dd28a3d6eedceb21c52b1dba199835a6f24cc75e7685',
      chainId: 134,
      publicationTimestamp: '2023-06-15T16:39:22.713Z',
      signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
      status: 'open',
      remaining: 10,
    },
    {
      order: {
        dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
        datasetprice: 20,
        volume: 10,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
        apprestrict: '0x0000000000000000000000000000000000000000',
        workerpoolrestrict: '0x0000000000000000000000000000000000000000',
        requesterrestrict: '0x0000000000000000000000000000000000000000',
        salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
        sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
      },
      orderHash:
        '0x396392835c2cbe933023dd28a3d6eedceb21c52b1dba199835a6f24cc75e7685',
      chainId: 134,
      publicationTimestamp: '2023-06-15T16:39:22.713Z',
      signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
      status: 'open',
      remaining: 10,
    },
  ],
  count: 2, // Assuming there are 2 orders
};
const MOCK_APP_ORDER = {
  orders: [
    {
      orderHash: '0xOrderHash123',
      chainId: 1,
      remaining: 5,
      status: 'open',
      signer: '0xSignerAddress123',
      publicationTimestamp: '2023-10-12T12:00:00Z',
      order: {
        app: '0xAppAddress123',
        appprice: 100,
        volume: 10,
        tag: '0xAppTag123',
        datasetrestrict: '0xDatasetRestrictAddress123',
        workerpoolrestrict: '0xWorkerpoolRestrictAddress123',
        requesterrestrict: '0xRequesterRestrictAddress123',
        salt: '0xSalt123',
        sign: '0xSign123',
      },
    },
    {
      orderHash: '0xOrderHash456',
      chainId: 134,
      remaining: 8,
      status: 'completed',
      signer: '0xSignerAddress456',
      publicationTimestamp: '2023-10-15T14:00:00Z',
      order: {
        app: '0xAnotherAppAddress456',
        appprice: 15,
        volume: 12,
        tag: '0xAnotherAppTag456',
        datasetrestrict: '0xAnotherDatasetRestrictAddress456',
        workerpoolrestrict: '0xAnotherWorkerpoolRestrictAddress456',
        requesterrestrict: '0xAnotherRequesterRestrictAddress456',
        salt: '0xAnotherSalt456',
        sign: '0xAnotherSign456',
      },
    },
    {
      orderHash: '0xOrderHash456',
      chainId: 134,
      remaining: 8,
      status: 'completed',
      signer: '0xSignerAddress456',
      publicationTimestamp: '2023-10-15T14:00:00Z',
      order: {
        app: '0xAnotherAppAddress456',
        appprice: 10,
        volume: 12,
        tag: '0xAnotherAppTag456',
        datasetrestrict: '0xAnotherDatasetRestrictAddress456',
        workerpoolrestrict: '0xAnotherWorkerpoolRestrictAddress456',
        requesterrestrict: '0xAnotherRequesterRestrictAddress456',
        salt: '0xAnotherSalt456',
        sign: '0xAnotherSign456',
      },
    },
  ],
  count: 2,
};
const MOCK_WORKERPOOL_ORDER = {
  orders: [
    {
      orderHash: '0xabcdef123456',
      chainId: 1,
      remaining: 10,
      status: 'published',
      signer: '0x1234567890',
      publicationTimestamp: '2023-10-12T10:00:00Z',
      order: {
        workerpool: '0x9876543210',
        workerpoolprice: 8,
        volume: 5,
        tag: '0x11223344',
        category: 1,
        trust: 0.8,
        apprestrict: '0x0987654321',
        datasetrestrict: '0x13572468',
        requesterrestrict: '0x8765432109',
        salt: '0xaabbccddeeff',
        sign: '0xabcdef012345',
      },
    },
    {
      orderHash: '0xabcdef123456',
      chainId: 1,
      remaining: 10,
      status: 'published',
      signer: '0x1234567890',
      publicationTimestamp: '2023-10-12T10:00:00Z',
      order: {
        workerpool: '0x9876543210',
        workerpoolprice: 0,
        volume: 5,
        tag: '0x11223344',
        category: 1,
        trust: 0.8,
        apprestrict: '0x0987654321',
        datasetrestrict: '0x13572468',
        requesterrestrict: '0x8765432109',
        salt: '0xaabbccddeeff',
        sign: '0xabcdef012345',
      },
    },
    {
      orderHash: '0xabcdef123456',
      chainId: 1,
      remaining: 10,
      status: 'published',
      signer: '0x1234567890',
      publicationTimestamp: '2023-10-12T10:00:00Z',
      order: {
        workerpool: '0x9876543210',
        workerpoolprice: 18,
        volume: 5,
        tag: '0x11223344',
        category: 1,
        trust: 0.8,
        apprestrict: '0x0987654321',
        datasetrestrict: '0x13572468',
        requesterrestrict: '0x8765432109',
        salt: '0xaabbccddeeff',
        sign: '0xabcdef012345',
      },
    },
  ],
  count: 2,
};
const EMPTY_DATASET_ORDER_BOOK: any = {
  orders: [],
  count: 0,
};
const EMPTY_APP_ORDER_BOOK: any = {
  orders: [],
  count: 0,
};
const EMPTY_WORKERPOOL_ORDER_BOOK: any = {
  orders: [],
  count: 0,
};

describe('processProtectedData', () => {
  let iexec: IExec;
  const wallet = new Wallet(TEST_PRIVATE_KEY);
  let dataProtector: IExecDataProtector;
  let protectedData: ProtectedDataWithSecretProps;
  iexec = new IExec({
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
      data: { email: 'abbes.benayache@iex.ec' },
      name: 'test do not use',
    });
    await dataProtector.grantAccess({
      authorizedApp: '0x4605e8af487897faaef16f0709391ef1be828591',
      protectedData: protectedData.address,
      authorizedUser: wallet.address,
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME);

  it(
    'should throw WorkflowError for missing Dataset order',
    async () => {
      const mockFetchDatasetOrderbook: any = jest
        .fn()
        .mockImplementationOnce(() => {
          return Promise.resolve({});
        });
      iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
      // const mockFetchWorkerpoolOrderbook: any = jest
      //   .fn()
      //   .mockImplementationOnce(() => {
      //     return Promise.resolve(MOCK_APP_ORDER);
      //   });
      // iexec.orderbook.fetchWorkerpoolOrderbook = mockFetchWorkerpoolOrderbook;
      // const mockFetchAppOrderbook: any = jest
      //   .fn()
      //   .mockImplementationOnce(() => {
      //     return Promise.resolve(MOCK_WORKERPOOL_ORDER);
      //   });
      // iexec.orderbook.fetchAppOrderbook = mockFetchAppOrderbook;
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
    2 * MAX_EXPECTED_BLOCKTIME
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

      // const mockFetchDatasetOrderbook: any = jest
      //   .fn()
      //   .mockImplementationOnce(() => {
      //     return Promise.resolve(MOCK_DATASET_ORDER);
      //   });
      // iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
      // const mockFetchWorkerpoolOrderbook: any = jest
      //   .fn()
      //   .mockImplementationOnce(() => {
      //     return Promise.resolve(MOCK_WORKERPOOL_ORDER);
      //   });
      // iexec.orderbook.fetchWorkerpoolOrderbook = mockFetchWorkerpoolOrderbook;

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
    2 * MAX_EXPECTED_BLOCKTIME
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
    2 * MAX_EXPECTED_BLOCKTIME
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
    2 * MAX_EXPECTED_BLOCKTIME
  );
  describe('processProtectedData > fetchOrdersUnderMaxPrice', () => {
    it('should return orders within the specified price limit', () => {
      const maxPrice = 100;
      const result = fetchOrdersUnderMaxPrice(
        MOCK_DATASET_ORDER,
        MOCK_APP_ORDER,
        MOCK_WORKERPOOL_ORDER,
        maxPrice
      );
      const totalPrice =
        result.datasetorder.datasetprice +
        result.apporder.appprice +
        result.workerpoolorder.workerpoolprice;
      expect(totalPrice).toBeLessThanOrEqual(maxPrice);
    });
    it('should throw an error when no orders are found within the specified price limit', () => {
      const maxPrice = 1;
      expect(() =>
        fetchOrdersUnderMaxPrice(
          MOCK_DATASET_ORDER,
          MOCK_APP_ORDER,
          MOCK_WORKERPOOL_ORDER,
          maxPrice
        )
      ).toThrowError('No orders found within the specified price limit.');
    });
    it('should throw an error when dataset orderbook is not provided', () => {
      expect(() =>
        fetchOrdersUnderMaxPrice(
          EMPTY_DATASET_ORDER_BOOK,
          MOCK_APP_ORDER,
          MOCK_WORKERPOOL_ORDER,
          10
        )
      ).toThrowError('No dataset orders found');
    });
    it('should throw an error when dataset orderbook is not provided', () => {
      expect(() =>
        fetchOrdersUnderMaxPrice(
          MOCK_DATASET_ORDER,
          EMPTY_APP_ORDER_BOOK,
          MOCK_WORKERPOOL_ORDER,
          10
        )
      ).toThrowError('No app orders found');
    });
    it('should throw an error when dataset orderbook is not provided', () => {
      expect(() =>
        fetchOrdersUnderMaxPrice(
          MOCK_DATASET_ORDER,
          MOCK_APP_ORDER,
          EMPTY_WORKERPOOL_ORDER_BOOK,
          10
        )
      ).toThrowError('No workerpool orders found');
    });
  });
});
