import { describe, expect, it, jest } from '@jest/globals';
import { ZeroAddress } from 'ethers';
import { Address } from 'iexec';
import { ValidationError } from 'yup';
import { SCONE_TAG } from '../../../../src/config/config.js';
import { type ProcessProtectedData } from '../../../../src/lib/dataProtectorCore/processProtectedData.js';
import {
  WorkflowError,
  processProtectedDataErrorMessage,
} from '../../../../src/utils/errors.js';
import {
  getRandomAddress,
  getRequiredFieldMessage,
  resolveWithNoOrder,
} from '../../../test-utils.js';
import { resolveWithOneAppOrder } from '../../../utils/appOrders.js';
import { resolveWithOneDatasetOrder } from '../../../utils/datasetOrders.js';
import { mockAllForProcessProtectedData } from '../../../utils/mockAllForProcessProtectedData.js';
import { resolveWithOneWorkerpoolOrder } from '../../../utils/workerpoolOrders.js';

jest.unstable_mockModule('../../../../src/utils/whitelist.js', () => ({
  isERC734: jest.fn(),
}));

jest.unstable_mockModule(
  '../../../../src/lib/dataProtectorCore/smartContract/getWhitelistContract.js',
  () => ({
    getWhitelistContract: jest.fn(),
  })
);

jest.unstable_mockModule(
  '../../../../src/lib/dataProtectorCore/smartContract/whitelistContract.read.js',
  () => ({
    isAddressInWhitelist: jest.fn(),
  })
);

describe('processProtectedData', () => {
  let testedModule: any;
  let processProtectedData: ProcessProtectedData;

  beforeAll(async () => {
    // import tested module after all mocked modules
    testedModule = await import(
      '../../../../src/lib/dataProtectorCore/processProtectedData.js'
    );
    processProtectedData = testedModule.processProtectedData;
  });

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
      const invalidUserWhitelist = getRandomAddress();
      const iexec = {
        wallet: {
          getAddress: jest
            .fn<() => Promise<Address>>()
            .mockResolvedValue(getRandomAddress()),
        },
      };

      // Say that given whitelist is NOT valid
      const { isERC734 } = (await import(
        '../../../../src/utils/whitelist.js'
      )) as { isERC734: jest.Mock<() => Promise<boolean>> };
      isERC734.mockResolvedValue(false);

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

  describe('When workerpool is explicitly set to the Zero address', () => {
    it("should call fetchWorkerpoolOrderbook with workerpool parameter equals to 'any'", async () => {
      // --- GIVEN
      const fetchWorkerpoolOrderbookMock = resolveWithOneWorkerpoolOrder();
      const iexec = mockAllForProcessProtectedData({
        fetchWorkerpoolOrderbookMock,
      });

      // --- WHEN
      await processProtectedData({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
        protectedData: getRandomAddress(),
        app: getRandomAddress(),
        workerpool: ZeroAddress, // <-- ZeroAddress explicitly set here
      });

      // --- THEN
      expect(fetchWorkerpoolOrderbookMock).toHaveBeenCalledWith({
        workerpool: 'any', // <-- What we want to test
        app: expect.any(String),
        dataset: expect.any(String),
        minTag: SCONE_TAG,
        maxTag: SCONE_TAG,
      });
    });
  });

  describe('When userWhitelist is given but user is NOT in this whitelist', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const validWhitelistAddress = getRandomAddress();
      const fetchDatasetOrderbookMock = resolveWithOneDatasetOrder();
      const iexec = mockAllForProcessProtectedData({
        fetchDatasetOrderbookMock,
      });

      // Say that given whitelist is valid
      const { isERC734 } = (await import(
        '../../../../src/utils/whitelist.js'
      )) as { isERC734: jest.Mock<() => Promise<boolean>> };
      isERC734.mockResolvedValue(true);

      // Say that current user (requester) is NOT in the whitelist
      const { isAddressInWhitelist } = (await import(
        '../../../../src/lib/dataProtectorCore/smartContract/whitelistContract.read.js'
      )) as { isAddressInWhitelist: jest.Mock<() => Promise<boolean>> };
      isAddressInWhitelist.mockResolvedValue(false);

      await expect(
        // --- WHEN
        processProtectedData({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: getRandomAddress(),
          app: getRandomAddress(),
          userWhitelist: validWhitelistAddress,
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

  describe('When userWhitelist is given', () => {
    it('should call fetchDatasetOrderbook() with this whitelist address for the requester param', async () => {
      // --- GIVEN
      const validWhitelistAddress = getRandomAddress();
      const fetchDatasetOrderbookMock = resolveWithOneDatasetOrder();
      const iexec = mockAllForProcessProtectedData({
        fetchDatasetOrderbookMock,
      });

      // Say that given whitelist is valid
      const { isERC734 } = (await import(
        '../../../../src/utils/whitelist.js'
      )) as { isERC734: jest.Mock<() => Promise<boolean>> };
      isERC734.mockResolvedValue(true);

      // Say that current user (requester) is in the whitelist
      const { isAddressInWhitelist } = (await import(
        '../../../../src/lib/dataProtectorCore/smartContract/whitelistContract.read.js'
      )) as { isAddressInWhitelist: jest.Mock<() => Promise<boolean>> };
      isAddressInWhitelist.mockResolvedValue(true);

      // --- WHEN
      await processProtectedData({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
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
});
