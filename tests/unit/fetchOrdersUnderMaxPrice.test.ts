import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { IExec } from 'iexec';
import { Wallet } from 'ethers';
import { getWeb3Provider } from '../../dist/utils/getWeb3Provider';
import {
  EMPTY_ORDER_BOOK,
  MAX_EXPECTED_BLOCKTIME,
  MOCK_APP_ORDER,
  MOCK_DATASET_ORDER,
  MOCK_WORKERPOOL_ORDER,
} from '../test-utils';
import { fetchOrdersUnderMaxPrice } from '../../dist/utils/fetchOrdersUnderMaxPrice';

describe('processProtectedData > fetchOrdersUnderMaxPrice', () => {
  const wallet = Wallet.createRandom();
  const iexec = new IExec({
    ethProvider: getWeb3Provider(wallet.privateKey),
  });

  const mockFetchWorkerpoolOrderbook: any = jest
    .fn()
    .mockImplementationOnce(() => {
      return Promise.resolve(MOCK_WORKERPOOL_ORDER);
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

  it(
    'should return the first free orders if maxPrice is undefined',
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
    const maxPrice = 0.000000000001;
    // mock orders without free orders
    const MOCK_DATASET_ORDER_WITHOUT_FIRST_ORDER = {
      orders: MOCK_DATASET_ORDER.orders.slice(1),
      count: MOCK_DATASET_ORDER.count - 1,
    };
    const MOCK_APP_ORDER_WITHOUT_FIRST_ORDER = {
      orders: MOCK_APP_ORDER.orders.slice(1),
      count: MOCK_APP_ORDER.count - 1,
    };
    const MOCK_WORKERPOOL_ORDER_WITHOUT_FIRST_ORDER = {
      orders: MOCK_WORKERPOOL_ORDER.orders.slice(1),
      count: MOCK_WORKERPOOL_ORDER.count - 1,
    };
    expect(() =>
      fetchOrdersUnderMaxPrice(
        MOCK_DATASET_ORDER_WITHOUT_FIRST_ORDER,
        MOCK_APP_ORDER_WITHOUT_FIRST_ORDER,
        MOCK_WORKERPOOL_ORDER_WITHOUT_FIRST_ORDER,
        maxPrice
      )
    ).toThrowError(
      `No orders found within the specified price limit ${maxPrice} nRLC.`
    );
  });
  it('should throw an error when dataset orderbook is not provided', () => {
    expect(() =>
      fetchOrdersUnderMaxPrice(
        EMPTY_ORDER_BOOK,
        MOCK_APP_ORDER,
        MOCK_WORKERPOOL_ORDER,
        10
      )
    ).toThrowError('No dataset orders found');
  });
  it('should throw an error when application orderbook is not provided', () => {
    expect(() =>
      fetchOrdersUnderMaxPrice(
        MOCK_DATASET_ORDER,
        EMPTY_ORDER_BOOK,
        MOCK_WORKERPOOL_ORDER,
        10
      )
    ).toThrowError('No app orders found');
  });
  it('should throw an error when workerpool orderbook is not provided', () => {
    expect(() =>
      fetchOrdersUnderMaxPrice(
        MOCK_DATASET_ORDER,
        MOCK_APP_ORDER,
        EMPTY_ORDER_BOOK,
        10
      )
    ).toThrowError('No workerpool orders found');
  });
});
