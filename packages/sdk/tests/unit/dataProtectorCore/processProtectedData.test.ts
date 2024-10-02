import { describe, expect, it, jest } from '@jest/globals';
import { ethers, Wallet, Contract } from 'ethers';
import { Address, Dealid } from 'iexec';
import { ValidationError } from 'yup';
import { SCONE_TAG, WORKERPOOL_ADDRESS } from '../../../src/config/config.js';
import { processProtectedData } from '../../../src/lib/dataProtectorCore/processProtectedData.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
} from '../../../src/utils/errors.js';
import { fetchOrdersUnderMaxPrice } from '../../../src/utils/fetchOrdersUnderMaxPrice.js';
import {
  getRandomAddress,
  getRandomTxHash,
  getRequiredFieldMessage,
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  observableMockComplete,
  resolveWithNoOrder,
} from '../../test-utils.js';
import { resolveWithOneAppOrder } from '../../utils/appOrders.js';
import {
  getOneDatasetOrder,
  resolveWithOneDatasetOrder,
} from '../../utils/datasetOrders.js';
import { resolveWithOneWorkerpoolOrder } from '../../utils/workerpoolOrders.js';

describe('processProtectedData', () => {
  describe('Check validation for input parameters', () => {
    describe('When protected data address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingProtectedDataAddress = undefined;

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: missingProtectedDataAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(getRequiredFieldMessage('protectedData'))
        );
      });
    });

    describe('When given protected data address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidProtectedDataAddress = '0x123456...';

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: invalidProtectedDataAddress,
            app: getRandomAddress(),
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'protectedData should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When app address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingAppAddress = undefined;

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: missingAppAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(getRequiredFieldMessage('authorizedApp'))
        );
      });
    });

    describe('When given app address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAppAddress = '0x123456...';

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: invalidAppAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'authorizedApp should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given user whitelist is NOT a valid Ethereum address', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidUserWhitelist = '0x123456...';

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            userWhitelist: invalidUserWhitelist,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('userWhitelist should be an ethereum address')
        );
      });
    });

    describe('When maxPrice is not a positive number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidMaxPrice = -1;

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            maxPrice: invalidMaxPrice,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('maxPrice must be greater than or equal to 0')
        );
      });
    });

    describe('When given args is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidArgs = { test: '123' };

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            // @ts-expect-error This is intended to actually test yup runtime validation
            args: invalidArgs,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('args should be a string'));
      });
    });

    describe('When given inputFiles is not a valid URL array', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidInputFiles = ['notAUrl'];

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            inputFiles: invalidInputFiles,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('notAUrl should be a url'));
      });
    });

    describe('When given secrets is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidSecrets = { 0: 123, 1: 'validSecret' };

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            // @ts-expect-error Type '{ 0: number; 1: string; }' is not assignable to type 'Record<number, string>'.
            secrets: invalidSecrets,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'secrets must be an object with numeric keys and string values'
          )
        );
      });
    });

    describe('When given workerpool is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidWorkerpool = '0x123456...';

        await expect(
          // --- WHEN
          processProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            workerpool: invalidWorkerpool,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'workerpool should be an ethereum address or a ENS name'
          )
        );
      });
    });
  });

  describe('When given user whitelist is NOT a valid whitelist contract address', () => {
    it('should throw a yup ValidationError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<Address>>()
            .mockResolvedValue(getRandomAddress()),
        },
        config: {
          resolveContractsClient: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue({
              provider: {
                getCode: jest
                  .fn<() => Promise<any>>()
                  .mockResolvedValue(
                    'contract byte code that does not include KEY_PURPOSE_SELECTOR'
                  ),
              },
            }),
        },
      };
      const invalidUserWhitelist = getRandomAddress();

      await expect(
        // --- WHEN
        processProtectedData({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: getRandomAddress(),
          app: getRandomAddress(),
          userWhitelist: invalidUserWhitelist,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to process protected data',
          errorCause: Error(
            'userWhitelist is not a valid whitelist contract, the contract must implement the ERC734 interface'
          ),
        })
      );
    });
  });

  describe('When there is NO dataset orders', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<Address>>()
            .mockResolvedValue(getRandomAddress()),
        },
        orderbook: {
          fetchDatasetOrderbook: resolveWithNoOrder(),
          fetchAppOrderbook: jest.fn(),
          fetchWorkerpoolOrderbook: jest.fn(),
        },
      };

      await expect(
        // --- WHEN
        processProtectedData({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: getRandomAddress(),
          app: getRandomAddress(),
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error('No dataset orders found'),
        })
      );
    });
  });

  describe('When there is NO app orders', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<Address>>()
            .mockResolvedValue(getRandomAddress()),
        },
        orderbook: {
          fetchDatasetOrderbook: resolveWithOneDatasetOrder(), // <-- 1 dataset order
          fetchAppOrderbook: resolveWithNoOrder(), // <-- NO app order
          fetchWorkerpoolOrderbook: jest.fn(),
        },
      };

      await expect(
        // --- WHEN
        processProtectedData({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: getRandomAddress(),
          app: getRandomAddress(),
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error('No app orders found'),
        })
      );
    });
  });

  describe('When there is NO workerpool orders', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<Address>>()
            .mockResolvedValue(getRandomAddress()),
        },
        orderbook: {
          fetchDatasetOrderbook: resolveWithOneDatasetOrder(), // <-- 1 dataset order
          fetchAppOrderbook: resolveWithOneAppOrder(), // <-- 1 app order
          fetchWorkerpoolOrderbook: resolveWithNoOrder(), // <-- NO workerpool order
        },
      };

      await expect(
        // --- WHEN
        processProtectedData({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: getRandomAddress(),
          app: getRandomAddress(),
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error('No workerpool orders found'),
        })
      );
    });
  });

  describe('When userWhitelist is given', () => {
    it('should call fetchDatasetOrderbook() with this whitelist address for the requester param', async () => {
      // --- GIVEN
      const validWhitelistAddress = getRandomAddress();
      const fetchDatasetOrderbookMock = jest
        .fn<() => Promise<any>>()
        .mockResolvedValue({
          count: 1,
          orders: [getOneDatasetOrder()],
        });
      const randomDealId = getRandomTxHash();
      const randomTaskId = getRandomTxHash();
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<Address>>()
            .mockResolvedValue(getRandomAddress()),
        },
        orderbook: {
          fetchDatasetOrderbook: fetchDatasetOrderbookMock,
          fetchAppOrderbook: resolveWithOneAppOrder(),
          fetchWorkerpoolOrderbook: resolveWithOneWorkerpoolOrder(),
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
      const whitelistUtils = {
        isERC734: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
        getWhitelistContract: jest.fn(),
        isAddressInWhitelist: jest
          .fn<() => Promise<boolean>>()
          .mockResolvedValue(true),
      };

      // --- WHEN
      await processProtectedData({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
        // @ts-expect-error TS type mismatch but that's fine for now
        whitelistUtils,
        protectedData: getRandomAddress(),
        app: getRandomAddress(),
        userWhitelist: validWhitelistAddress,
      });

      // --- THEN
      expect(fetchDatasetOrderbookMock).toHaveBeenCalledWith(
        expect.any(String),
        {
          app: expect.any(String),
          workerpool: expect.any(String),
          requester: validWhitelistAddress.toLowerCase(), // <-- whitelist address instead of user wallet address
        }
      );
    });
  });

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
