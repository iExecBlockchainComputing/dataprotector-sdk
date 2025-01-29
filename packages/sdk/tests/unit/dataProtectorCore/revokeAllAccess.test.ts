import { describe, expect, it, jest } from '@jest/globals';
import { ValidationError } from 'yup';
import { revokeAllAccess } from '../../../src/lib/dataProtectorCore/revokeAllAccess.js';
import { formatGrantedAccess } from '../../../src/utils/formatGrantedAccess.js';
import { getRandomTxHash, getRequiredFieldMessage } from '../../test-utils.js';
import { getOneDatasetOrder } from '../../utils/datasetOrders.js';

describe('dataProtectorCore.revokeAllAccess()', () => {
  describe('Check validation for input parameters', () => {
    describe('When protected data address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingProtectedDataAddress = undefined;

        await expect(
          // --- WHEN
          revokeAllAccess({
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
          revokeAllAccess({
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

    describe('When given authorized app address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAuthorizedAppAddress = '0x123456...';

        await expect(
          // --- WHEN
          revokeAllAccess({
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

    describe('When given authorized user address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAuthorizedUserAddress = '0x789cba...';

        await expect(
          // --- WHEN
          revokeAllAccess({
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
  });

  describe('When there is NO access to revoke', () => {
    it('should just work', async () => {
      // --- GIVEN
      const iexec = {
        orderbook: {
          fetchDatasetOrderbook: jest.fn<any>().mockResolvedValue({
            count: 0,
            orders: [],
          }),
        },
      };

      // --- WHEN
      await revokeAllAccess({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
        protectedData: '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946',
      });

      // --- THEN
      expect(true).toBe(true);
    });
  });

  describe('When there is one access to revoke', () => {
    it('should call iexec-sdk cancelDatasetorder() with the correct parameters', async () => {
      // --- GIVEN
      const protectedDataAddress = '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';
      const cancelDatasetorderTxHash = getRandomTxHash();
      const cancelDatasetorderMock = jest.fn<any>().mockResolvedValue({
        txHash: cancelDatasetorderTxHash,
      });
      const oneDatasetOrder = getOneDatasetOrder({
        withDataset: protectedDataAddress,
      });
      const iexec = {
        orderbook: {
          fetchDatasetOrderbook: jest.fn<any>().mockResolvedValue({
            count: 1,
            orders: [oneDatasetOrder],
          }),
        },
        order: {
          cancelDatasetorder: cancelDatasetorderMock,
        },
      };
      const onStatusUpdateMock = jest.fn();

      // --- WHEN
      await revokeAllAccess({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
        protectedData: protectedDataAddress,
        onStatusUpdate: onStatusUpdateMock,
      });

      // --- THEN
      expect(cancelDatasetorderMock).toHaveBeenCalledWith(
        formatGrantedAccess(oneDatasetOrder.order)
      );
      expect(onStatusUpdateMock).toHaveBeenCalledTimes(4);
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(1, {
        title: 'RETRIEVE_ALL_GRANTED_ACCESS',
        isDone: false,
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(2, {
        title: 'RETRIEVE_ALL_GRANTED_ACCESS',
        isDone: true,
        payload: {
          grantedAccessCount: '1',
        },
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(3, {
        title: 'REVOKE_ONE_ACCESS',
        isDone: false,
        payload: {
          access: expect.any(Object),
        },
      });
      expect(onStatusUpdateMock).toHaveBeenNthCalledWith(4, {
        title: 'REVOKE_ONE_ACCESS',
        isDone: true,
        payload: {
          access: expect.any(Object),
          txHash: cancelDatasetorderTxHash,
        },
      });
    });
  });
});
