import { jest } from '@jest/globals';
import { Address, Dealid } from 'iexec';
import {
  getRandomAddress,
  getRandomTxHash,
  observableMockComplete,
} from '../test-utils.js';
import { resolveWithOneAppOrder } from './appOrders.js';
import { resolveWithOneDatasetOrder } from './datasetOrders.js';
import { resolveWithOneWorkerpoolOrder } from './workerpoolOrders.js';
import Mock = jest.Mock;

export function mockAllForProcessProtectedData({
  fetchDatasetOrderbookMock,
  fetchWorkerpoolOrderbookMock,
}: {
  fetchDatasetOrderbookMock?: Mock<() => any>;
  fetchWorkerpoolOrderbookMock?: Mock<() => any>;
} = {}) {
  const randomDealId = getRandomTxHash();
  const randomTaskId = getRandomTxHash();

  const iexecMock = {
    wallet: {
      getAddress: jest
        .fn<() => Promise<Address>>()
        .mockResolvedValue(getRandomAddress()),
    },
    orderbook: {
      fetchDatasetOrderbook:
        fetchDatasetOrderbookMock ?? resolveWithOneDatasetOrder(),
      fetchAppOrderbook: resolveWithOneAppOrder(),
      fetchWorkerpoolOrderbook:
        fetchWorkerpoolOrderbookMock ?? resolveWithOneWorkerpoolOrder(),
    },
    order: {
      createRequestorder: jest.fn(),
      signRequestorder: jest.fn(),
      matchOrders: jest
        .fn<
          () => Promise<{
            dealid: Address;
            txHash: string;
          }>
        >()
        .mockResolvedValue({
          dealid: randomDealId,
          txHash: getRandomTxHash(),
        }),
    },
    deal: {
      computeTaskId: jest
        .fn<() => Promise<Address>>()
        .mockResolvedValue(randomTaskId),
      show: jest.fn<() => Promise<{ params: string }>>().mockResolvedValue({
        params: '{}',
      }),
    },
    task: {
      obsTask: observableMockComplete(),
      fetchResults: jest.fn<() => Promise<any>>().mockResolvedValue({
        arrayBuffer: jest.fn(),
      }),
      show: jest.fn<() => Promise<{ dealid: Dealid }>>().mockResolvedValue({
        dealid: randomDealId,
      }),
    },
  };

  const whitelistUtilsMock = {
    isERC734: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    getWhitelistContract: jest.fn(),
    isAddressInWhitelist: jest
      .fn<() => Promise<boolean>>()
      .mockResolvedValue(true),
  };

  return {
    iexec: iexecMock,
    whitelistUtils: whitelistUtilsMock,
  };
}
