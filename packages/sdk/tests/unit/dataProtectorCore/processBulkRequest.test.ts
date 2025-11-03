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

// Mock bulk request for testing
const mockBulkRequest = {
  params:
    '{"iexec_secrets":{},"iexec_result_storage_provider":"ipfs","bulk_cid":"QmQpQDkEJ6yAgyXPqxwn9Kv3BUTR1pf4mHKW2jeAiE6N34"}',
  callback: '0x0000000000000000000000000000000000000000',
  beneficiary: '0xc063e7ed698DEf5Ab483299a4867b516a00135Be',
  trust: '0',
  category: '0',
  tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
  volume: '4',
  requester: '0xc063e7ed698DEf5Ab483299a4867b516a00135Be',
  workerpoolmaxprice: '100000000',
  workerpool: '0x0000000000000000000000000000000000000000',
  datasetmaxprice: '0',
  dataset: '0x0000000000000000000000000000000000000000',
  appmaxprice: '0',
  app: '0x94b1D1f9065fD2a2971Cdb6F59e9E8d3517563E9',
  salt: '0x402e71646bae6dc6a9e6069bafe5e0c675b28ad93038775ae715a4ca846bfc4a',
  sign: '0xf21c6770574d91aee77df960517a7d22464ef39e9549ebe28ecdd59d5de6a65c34eb27b412abec85482d4e855858caecaf2d93c36c9253604368d7a67258786e1b',
};

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
  pushRequesterSecret: jest
    .fn<() => Promise<Record<number, string>>>()
    .mockResolvedValue({ 1: 'secrets-id-123' }),
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
    describe('When bulkRequest is NOT given', () => {
      it('should throw an error with the correct message', async () => {
        // --- GIVEN
        const missingBulkOrders = undefined;

        await expect(
          // --- WHEN
          processBulkRequest({
            // @ts-expect-error No need for iexec here
            iexec: {},
            defaultWorkerpool: getRandomAddress(),
            bulkRequest: missingBulkOrders,
          })
          // --- THEN
        ).rejects.toThrow(getRequiredFieldMessage('bulkRequest'));
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
            defaultWorkerpool: getRandomAddress(),
            bulkRequest: mockBulkRequest,
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
            defaultWorkerpool: getRandomAddress(),
            bulkRequest: mockBulkRequest,
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
          defaultWorkerpool: getRandomAddress(),
          bulkRequest: mockBulkRequest,
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
          bulkRequest: mockBulkRequest,
          defaultWorkerpool: getRandomAddress(),
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
