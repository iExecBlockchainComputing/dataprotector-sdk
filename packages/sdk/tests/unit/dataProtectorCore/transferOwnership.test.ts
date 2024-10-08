import { describe, expect, it, jest } from '@jest/globals';
import { ValidationError } from 'yup';
import { WorkflowError } from '../../../src/index.js';
import { transferOwnership } from '../../../src/lib/dataProtectorCore/transferOwnership.js';
import { getRandomAddress, getRequiredFieldMessage } from '../../test-utils.js';

describe('dataProtectorCore.transferOwnership()', () => {
  describe('Check validation for input parameters', () => {
    describe('When protected data address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingProtectedDataAddress = undefined;

        await expect(
          // --- WHEN
          transferOwnership({
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
          transferOwnership({
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

    describe('When new user is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingNewUserAddress = undefined;

        await expect(
          // --- WHEN
          transferOwnership({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            newOwner: missingNewUserAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(getRequiredFieldMessage('newOwner'))
        );
      });
    });

    describe('When given new user address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidNewUserAddress = '0xc5e9f4...';

        await expect(
          // --- WHEN
          transferOwnership({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: getRandomAddress(),
            newOwner: invalidNewUserAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'newOwner should be an ethereum address or a ENS name'
          )
        );
      });
    });
  });

  describe('When there is a problem while transferring the underlying dataset', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        dataset: {
          transferDataset: jest.fn<any>().mockRejectedValue(new Error('Boom')),
        },
      };

      await expect(
        // --- WHEN
        transferOwnership({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: getRandomAddress(),
          newOwner: getRandomAddress(),
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to transfer protectedData ownership',
          errorCause: Error('Boom'),
        })
      );
    });
  });

  describe('When it is a valid transferOwnership() call', () => {
    it('should go as expected and return confirmation info', async () => {
      // --- GIVEN
      const protectedDataAddress = getRandomAddress();
      const newOwnerAddress = getRandomAddress();
      const txHash =
        '0x2b5e1559aef162773564bc12e04570f8435fe345d4ae31fbed0ad147d4b12023';
      const iexec = {
        dataset: {
          transferDataset: jest.fn<any>().mockResolvedValue({
            address: protectedDataAddress,
            to: newOwnerAddress,
            txHash,
          }),
        },
      };

      // --- WHEN
      const transferOwnershipResult = await transferOwnership({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
        protectedData: protectedDataAddress,
        newOwner: newOwnerAddress,
      });

      // --- THEN
      expect(transferOwnershipResult).toEqual({
        address: protectedDataAddress,
        to: newOwnerAddress,
        txHash,
      });
    });
  });
});
