import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExec } from 'iexec';
import { getWeb3Provider } from '../../../../src/index.js';
import { fetchOrdersUnderMaxPrice } from '../../../../src/utils/fetchOrdersUnderMaxPrice.js';
import { EMPTY_ORDER_BOOK } from '../../../test-utils.js';
import { MOCK_APP_ORDER } from '../../../utils/appOrders.js';
import { MOCK_DATASET_ORDER } from '../../../utils/datasetOrders.js';

describe('processProtectedData > fetchOrdersUnderMaxPrice', () => {
  const wallet = Wallet.createRandom();
  const iexec = new IExec({
    ethProvider: getWeb3Provider(wallet.privateKey),
  });

  const mockFetchDatasetOrderbook: any = jest
    .fn()
    .mockImplementationOnce(() => {
      return Promise.resolve(MOCK_DATASET_ORDER);
    });

  const mockFetchAppOrderbook: any = jest.fn().mockImplementationOnce(() => {
    return Promise.resolve(MOCK_APP_ORDER);
  });

  beforeEach(() => {
    iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
    iexec.orderbook.fetchAppOrderbook = mockFetchAppOrderbook;
  });

  it('should return the first free orders if maxPrice is undefined', () => {
    const maxPrice = undefined;
    const result = fetchOrdersUnderMaxPrice(
      MOCK_DATASET_ORDER,
      MOCK_APP_ORDER,
      maxPrice
    );
    expect(result).toEqual({
      datasetorder: MOCK_DATASET_ORDER.orders[0]?.order,
      apporder: MOCK_APP_ORDER.orders[0]?.order,
    });
  });

  it('should return orders within the specified price limit', () => {
    const maxPrice = 100;
    const result = fetchOrdersUnderMaxPrice(
      MOCK_DATASET_ORDER,
      MOCK_APP_ORDER,
      maxPrice
    );
    const totalPrice =
      result.datasetorder.datasetprice + result.apporder.appprice;
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
    expect(() =>
      fetchOrdersUnderMaxPrice(
        MOCK_DATASET_ORDER_WITHOUT_FIRST_ORDER,
        MOCK_APP_ORDER_WITHOUT_FIRST_ORDER,
        maxPrice
      )
    ).toThrow(
      `No orders found within the specified price limit ${maxPrice} nRLC.`
    );
  });

  it('should throw an error when dataset orderbook is not provided', () => {
    expect(() =>
      fetchOrdersUnderMaxPrice(EMPTY_ORDER_BOOK, MOCK_APP_ORDER, 10)
    ).toThrow('No dataset orders found');
  });

  it('should throw an error when application orderbook is not provided', () => {
    expect(() =>
      fetchOrdersUnderMaxPrice(MOCK_DATASET_ORDER, EMPTY_ORDER_BOOK, 10)
    ).toThrow('No app orders found');
  });
});
