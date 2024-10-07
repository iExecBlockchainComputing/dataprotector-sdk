import { describe, expect, it, jest } from '@jest/globals';
import { ZeroAddress } from 'ethers';
import { NULL_ADDRESS } from 'iexec/utils';
import { grantAccess } from '../../../src/lib/dataProtectorCore/grantAccess.js';
import {
  grantAccessErrorMessage,
  ValidationError,
  WorkflowError,
} from '../../../src/utils/errors.js';
import { formatGrantedAccess } from '../../../src/utils/formatGrantedAccess.js';
import {
  getRequiredFieldMessage,
  resolveWithNoOrder,
} from '../../test-utils.js';
import {
  getDatasetOrderObject,
  resolveWithOneDatasetOrder,
} from '../../utils/datasetOrders.js';

describe('dataProtectorCore.grantAccess()', () => {
  describe('Check validation for input parameters', () => {
    describe('When protected data address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidProtectedDataAddress = undefined;

        await expect(
          // --- WHEN
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: invalidProtectedDataAddress,
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
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: invalidProtectedDataAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'protectedData should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When authorized app address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAuthorizedAppAddress = undefined;

        await expect(
          // --- WHEN
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
            authorizedApp: invalidAuthorizedAppAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(getRequiredFieldMessage('authorizedApp'))
        );
      });
    });

    describe('When given authorized app address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAuthorizedAppAddress = '0x123456...';

        await expect(
          // --- WHEN
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
            authorizedApp: invalidAuthorizedAppAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'authorizedApp should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given authorized app address is the Zero address', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        await expect(
          // --- GIVEN / WHEN
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
            authorizedApp: ZeroAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'Forbidden to use 0x0000000000000000000000000000000000000000 as authorizedApp, this would give access to any app'
          )
        );
      });
    });

    describe('When given authorized user address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAuthorizedUserAddress = '0x789cba...';

        await expect(
          // --- WHEN
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
            authorizedApp: '0x7a8f4c23ef61dd295b683409fe15ad76bc92c14e',
            authorizedUser: invalidAuthorizedUserAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'authorizedUser should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given price per access is NOT >= 0', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidPricePerAccess = -1;

        await expect(
          // --- WHEN
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
            authorizedApp: '0x7a8f4c23ef61dd295b683409fe15ad76bc92c14e',
            pricePerAccess: invalidPricePerAccess,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('pricePerAccess should be a positive integer')
        );
      });
    });

    describe('When given number of access is NOT > 0', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidNumberOfAccess = 0;

        await expect(
          // --- WHEN
          grantAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
            authorizedApp: '0x7a8f4c23ef61dd295b683409fe15ad76bc92c14e',
            numberOfAccess: invalidNumberOfAccess,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'numberOfAccess should be a strictly positive integer'
          )
        );
      });
    });

    describe('When given authorized app is NOT a valid ENS', () => {
      it('should resolve it to its corresponding ethereum address', async () => {
        // --- GIVEN
        const invalidEns = 'not.a.valid.ens.eth';
        const iexec = {
          ens: {
            resolveName: jest
              .fn<() => Promise<undefined>>()
              .mockResolvedValue(undefined),
          },
        };

        await expect(
          // --- WHEN
          grantAccess({
            // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
            iexec,
            protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
            authorizedApp: invalidEns,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('authorizedApp ENS name is not valid')
        );
      });
    });
  });

  describe('When access has already been granted to this same app', () => {
    it('should return the correct error', async () => {
      // --- GIVEN
      const authorizedApp = '0x7a8f4c23ef61dd295b683409fe15ad76bc92c14e';
      const iexec = {
        orderbook: {
          fetchDatasetOrderbook: resolveWithOneDatasetOrder({
            withApp: authorizedApp,
          }),
        },
      };

      await expect(
        // --- WHEN
        grantAccess({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
          authorizedApp: authorizedApp,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: grantAccessErrorMessage,
          errorCause: Error(
            `An access has been already granted to the user: ${NULL_ADDRESS} with the app: ${authorizedApp}`
          ),
        })
      );
    });
  });

  describe('When it is a valid grantAccess() call', () => {
    it('should go as expected and return the formatted granted access', async () => {
      // --- GIVEN
      const protectedDataAddress = '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';
      const authorizedApp = '0x7a8f4c23ef61dd295b683409fe15ad76bc92c14e';
      const iexec = {
        orderbook: {
          fetchDatasetOrderbook: resolveWithNoOrder(), // Say that access does not yet exist
        },
        app: {
          checkDeployedApp: jest.fn().mockReturnValue(true),
          showApp: jest.fn<any>().mockResolvedValue({
            app: { appMREnclave: '{ "framework": "SCONE" }' },
          }),
        },
        order: {
          createDatasetorder: jest.fn<any>().mockResolvedValue({
            ...getDatasetOrderObject({
              withDataset: protectedDataAddress,
              withApp: authorizedApp,
            }),
            sign: undefined,
          }),
          signDatasetorder: jest.fn<any>().mockResolvedValue(
            getDatasetOrderObject({
              withDataset: protectedDataAddress,
              withApp: authorizedApp,
            })
          ),
          publishDatasetorder: jest.fn<any>().mockResolvedValue(true),
        },
      };

      // --- WHEN
      const grantedAccess = await grantAccess({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
        protectedData: protectedDataAddress,
        authorizedApp: authorizedApp,
      });

      // --- THEN
      expect(grantedAccess).toEqual(
        formatGrantedAccess(
          getDatasetOrderObject({
            withDataset: protectedDataAddress,
            withApp: authorizedApp,
          })
        )
      );
    });
  });
});
