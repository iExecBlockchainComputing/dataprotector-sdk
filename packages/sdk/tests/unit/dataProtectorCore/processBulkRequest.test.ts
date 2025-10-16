import { describe, expect, it, jest, beforeAll } from '@jest/globals';
import { ValidationError } from 'yup';
import { type ProcessBulkRequest } from '../../../src/lib/dataProtectorCore/processBulkRequest.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
} from '../../../src/utils/errors.js';
import {
  getRandomAddress,
  getRequiredFieldMessage,
  mockWorkerpoolOrderbook,
} from '../../test-utils.js';
import { resolveWithOneAppOrder } from '../../utils/appOrders.js';
import { resolveWithOneWorkerpoolOrder } from '../../utils/workerpoolOrders.js';

// Mock bulk orders for testing
const mockBulkOrders = [
  {
    dataset: getRandomAddress(),
    datasetprice: '1000000000000000000', // 1 RLC in wei
    volume: '10',
    tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
    apprestrict: '0x0000000000000000000000000000000000000000',
    workerpoolrestrict: '0x0000000000000000000000000000000000000000',
    requesterrestrict: '0x0000000000000000000000000000000000000000',
    salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    sign: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    remainingAccess: 10,
  },
  {
    dataset: getRandomAddress(),
    datasetprice: '2000000000000000000', // 2 RLC in wei
    volume: '5',
    tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
    apprestrict: '0x0000000000000000000000000000000000000000',
    workerpoolrestrict: '0x0000000000000000000000000000000000000000',
    requesterrestrict: '0x0000000000000000000000000000000000000000',
    salt: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef1',
    sign: '0xbcdef12345678901bcdef12345678901bcdef12345678901bcdef12345678901',
    remainingAccess: 5,
  },
];

jest.unstable_mockModule('../../../src/utils/whitelist.js', () => ({
  isERC734: jest.fn(),
}));

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorCore/smartContract/getWhitelistContract.js',
  () => ({
    getWhitelistContract: jest.fn(),
  })
);

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorCore/smartContract/whitelistContract.read.js',
  () => ({
    isAddressInWhitelist: jest.fn(),
  })
);

jest.unstable_mockModule(
  '../../../src/utils/processProtectedData.models.js',
  () => ({
    filterWorkerpoolOrders: jest.fn(
      () => mockWorkerpoolOrderbook.orders[0].order
    ),
    checkUserVoucher: jest.fn(),
  })
);

jest.unstable_mockModule('../../../src/utils/pushRequesterSecret.js', () => ({
  pushRequesterSecret: jest.fn<() => Promise<Record<number, string>>>().mockResolvedValue({ 1: 'secrets-id-123' }),
}));

describe('processBulkRequest', () => {
  let testedModule: any;
  let processBulkRequest: ProcessBulkRequest;

  beforeAll(async () => {
    // import tested module after all mocked modules
    testedModule = await import(
      '../../../src/lib/dataProtectorCore/processBulkRequest.js'
    );
    processBulkRequest = testedModule.processBulkRequest;
  });

  describe('Check validation for input parameters', () => {
    describe('When bulkOrders is NOT given', () => {
      it('should throw an error with the correct message', async () => {
        // --- GIVEN
        const missingBulkOrders = undefined;

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: missingBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
          })
          // --- THEN
        ).rejects.toThrow('bulkOrders is required and must not be empty');
      });
    });

    describe('When bulkOrders is empty', () => {
      it('should throw an error with the correct message', async () => {
        // --- GIVEN
        const emptyBulkOrders: any[] = [];

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: emptyBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
          })
          // --- THEN
        ).rejects.toThrow('bulkOrders is required and must not be empty');
      });
    });

    describe('When app address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingAppAddress = undefined;

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: missingAppAddress,
            maxProtectedDataPerTask: 1,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError(getRequiredFieldMessage('app')));
      });
    });

    describe('When given app address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAppAddress = '0x123456...';

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: invalidAppAddress,
            maxProtectedDataPerTask: 1,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('app should be an ethereum address or a ENS name')
        );
      });
    });

    describe('When maxProtectedDataPerTask is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingMaxProtectedDataPerTask = undefined;

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: missingMaxProtectedDataPerTask,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            getRequiredFieldMessage('maxProtectedDataPerTask')
          )
        );
      });
    });

    describe('When maxProtectedDataPerTask is not a positive number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidMaxProtectedDataPerTask = -1;

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: invalidMaxProtectedDataPerTask,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'maxProtectedDataPerTask must be greater than or equal to 0'
          )
        );
      });
    });

    describe('When appMaxPrice is not a positive number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAppMaxPrice = -1;

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
            appMaxPrice: invalidAppMaxPrice,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('appMaxPrice must be greater than or equal to 0')
        );
      });
    });

    describe('When workerpoolMaxPrice is not a positive number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidWorkerpoolMaxPrice = -1;

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
            workerpoolMaxPrice: invalidWorkerpoolMaxPrice,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'workerpoolMaxPrice must be greater than or equal to 0'
          )
        );
      });
    });

    describe('When given args is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidArgs = { test: '123' };

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
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
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
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
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
            // @ts-expect-error This is intended to actually test yup runtime validation
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
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
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

    describe('When given voucherOwner is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidVoucherOwner = '0x123456...';

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
            voucherOwner: invalidVoucherOwner,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'voucherOwner should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When pemPrivateKey is provided without encryptResult', () => {
      it('should throw an error with the correct message', async () => {
        // --- GIVEN
        const encryptResult = false;
        const pemPrivateKey = 'test-key';

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            bulkOrders: mockBulkOrders,
            app: getRandomAddress(),
            maxProtectedDataPerTask: 1,
            encryptResult,
            pemPrivateKey,
          })
          // --- THEN
        ).rejects.toThrow(
          'pemPrivateKey can only be provided when encryptResult is true'
        );
      });
    });
  });

  describe('When there is NO app orders', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<string>>()
            .mockResolvedValue(getRandomAddress()),
        },
        orderbook: {
          fetchAppOrderbook: jest
            .fn<() => Promise<{ orders: []; count: 0 }>>()
            .mockResolvedValue({ orders: [], count: 0 }), // <-- NO app order
          fetchWorkerpoolOrderbook: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(mockWorkerpoolOrderbook),
        },
        order: {
          prepareDatasetBulk: jest
            .fn<() => Promise<{ cid: string; volume: number }>>()
            .mockResolvedValue({ cid: 'test-cid', volume: 1 }),
          createRequestorder: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue({}),
          signRequestorder: jest.fn<() => Promise<any>>().mockResolvedValue({}),
        },
      };

      await expect(
        // --- WHEN
        processBulkRequest({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          bulkOrders: mockBulkOrders,
          app: getRandomAddress(),
          maxProtectedDataPerTask: 1,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error('No App order found for the desired price'),
        })
      );
    });
  });

  describe('When userWhitelist is given but user is NOT in this whitelist', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const validWhitelistAddress = getRandomAddress();
      const bulkOrdersWithWhitelist = [
        {
          ...mockBulkOrders[0],
          requesterrestrict: validWhitelistAddress,
        },
      ];

      // Say that given whitelist is valid
      const { isERC734 } = (await import(
        '../../../src/utils/whitelist.js'
      )) as { isERC734: jest.Mock<() => Promise<boolean>> };
      isERC734.mockResolvedValue(true);

      // Say that current user (requester) is NOT in the whitelist
      const { isAddressInWhitelist } = (await import(
        '../../../src/lib/dataProtectorCore/smartContract/whitelistContract.read.js'
      )) as { isAddressInWhitelist: jest.Mock<() => Promise<boolean>> };
      isAddressInWhitelist.mockResolvedValue(false);

      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<string>>()
            .mockResolvedValue(getRandomAddress()),
        },
        orderbook: {
          fetchAppOrderbook: resolveWithOneAppOrder(),
          fetchWorkerpoolOrderbook: resolveWithOneWorkerpoolOrder(),
        },
        order: {
          prepareDatasetBulk: jest
            .fn<() => Promise<{ cid: string; volume: number }>>()
            .mockResolvedValue({ cid: 'test-cid', volume: 1 }),
          createRequestorder: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue({}),
          signRequestorder: jest.fn<() => Promise<any>>().mockResolvedValue({}),
        },
      };

      await expect(
        // --- WHEN
        processBulkRequest({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          bulkOrders: bulkOrdersWithWhitelist,
          app: getRandomAddress(),
          maxProtectedDataPerTask: 1,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error(
            "As a user, you are not in the whitelist. You can't access the protectedData so you can't process it."
          ),
        })
      );
    });
  });

  describe('When voucher is used but user has no voucher', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<string>>()
            .mockResolvedValue(getRandomAddress()),
        },
        voucher: {
          showUserVoucher: jest
            .fn<() => Promise<any>>()
            .mockRejectedValue(
              new Error('No Voucher found for address test-address')
            ),
        },
        orderbook: {
          fetchAppOrderbook: resolveWithOneAppOrder(),
          fetchWorkerpoolOrderbook: resolveWithOneWorkerpoolOrder(),
        },
        order: {
          prepareDatasetBulk: jest
            .fn<() => Promise<{ cid: string; volume: number }>>()
            .mockResolvedValue({ cid: 'test-cid', volume: 1 }),
          createRequestorder: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue({}),
          signRequestorder: jest.fn<() => Promise<any>>().mockResolvedValue({}),
        },
      };

      await expect(
        // --- WHEN
        processBulkRequest({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          bulkOrders: mockBulkOrders,
          app: getRandomAddress(),
          maxProtectedDataPerTask: 1,
          useVoucher: true,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: processProtectedDataErrorMessage,
          errorCause: Error(
            'Oops, it seems your wallet is not associated with any voucher. Check on https://builder.iex.ec/'
          ),
        })
      );
    });
  });
});
