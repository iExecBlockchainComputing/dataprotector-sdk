import { describe, expect, it, jest } from '@jest/globals';
import { revokeOneAccess } from '../../../src/lib/dataProtectorCore/revokeOneAccess.js';
import { ValidationError, WorkflowError } from '../../../src/utils/errors.js';
import { getRandomAddress } from '../../test-utils.js';

const oneGrantedAccess = {
  dataset: getRandomAddress(),
  datasetprice: 0,
  volume: 1,
  tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
  apprestrict: getRandomAddress(),
  workerpoolrestrict: getRandomAddress(),
  requesterrestrict: getRandomAddress(),
  salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
  sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

describe('dataProtectorCore.revokeOneAccess()', () => {
  describe('Check validation for input parameters', () => {
    describe('When granted access object is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        await expect(
          // --- GIVEN / WHEN
          revokeOneAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('The GrantedAccess is required to be revoked')
        );
      });
    });

    describe('When given granted access object is NOT complete', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        await expect(
          // --- GIVEN / WHEN
          revokeOneAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            ...oneGrantedAccess,
            sign: undefined, // <-- missing required field
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('sign is a required field'));
      });
    });
  });

  describe('When iexec cancelDatasetorder fails', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const iexec = {
        order: {
          cancelDatasetorder: jest
            .fn<any>()
            .mockRejectedValue(new Error('Boom')),
        },
      };

      await expect(
        // --- WHEN
        revokeOneAccess({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          ...oneGrantedAccess,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to revoke access',
          errorCause: Error('Boom'),
        })
      );
    });
  });

  describe('When iexec cancelDatasetorder works as expected', () => {
    it('should return the granted access with the tx hash of the revoked', async () => {
      // --- GIVEN
      const iexec = {
        order: {
          cancelDatasetorder: jest.fn<any>().mockResolvedValue({
            txHash:
              '0x2c5e1669aef162773564bc12e03290f8435fe345d4bd31fbed0ad147d4b12023',
          }),
        },
      };

      // --- WHEN
      const revokeOneAccessResult = await revokeOneAccess({
        // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
        iexec,
        ...oneGrantedAccess,
      });

      // --- THEN
      expect(revokeOneAccessResult.txHash).toBe(
        '0x2c5e1669aef162773564bc12e03290f8435fe345d4bd31fbed0ad147d4b12023'
      );
    });
  });
});
