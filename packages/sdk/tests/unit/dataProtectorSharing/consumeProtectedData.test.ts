import { describe, expect, it } from '@jest/globals';
import { ValidationError } from 'yup';
import { consumeProtectedData } from '../../../src/lib/dataProtectorSharing/consumeProtectedData.js';
import { getRandomAddress, getRequiredFieldMessage } from '../../test-utils.js';
import { CHAIN_CONFIG } from '../../../src/config/config.js';

describe('consumeProtectedData', () => {
  describe('Check validation for input parameters', () => {
    describe('When protected data is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        const missingProtectedData = undefined;

        await expect(
          consumeProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: CHAIN_CONFIG['134'].sharingContractAddress,
            protectedData: missingProtectedData,
            app: getRandomAddress(),
          })
        ).rejects.toThrow(
          new ValidationError(getRequiredFieldMessage('protectedData'))
        );
      });
    });

    describe('When given protected data is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        const invalidProtectedData = '0x123456...';

        await expect(
          consumeProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: CHAIN_CONFIG['134'].sharingContractAddress,
            protectedData: invalidProtectedData,
            app: getRandomAddress(),
          })
        ).rejects.toThrow(
          new ValidationError(
            'protectedData should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When app address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        const missingAppAddress = undefined;

        await expect(
          consumeProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: CHAIN_CONFIG['134'].sharingContractAddress,
            protectedData: getRandomAddress(),
            app: missingAppAddress,
          })
        ).rejects.toThrow(new ValidationError(getRequiredFieldMessage('app')));
      });
    });

    describe('When given app address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        const invalidAppAddress = '0x123456...';

        await expect(
          consumeProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: CHAIN_CONFIG['134'].sharingContractAddress,
            protectedData: getRandomAddress(),
            app: invalidAppAddress,
          })
        ).rejects.toThrow(
          new ValidationError('app should be an ethereum address or a ENS name')
        );
      });
    });

    describe('When maxPrice is not a positive number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        const invalidMaxPrice = -1;

        await expect(
          consumeProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: CHAIN_CONFIG['134'].sharingContractAddress,
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            maxPrice: invalidMaxPrice,
          })
        ).rejects.toThrow(
          new ValidationError('maxPrice must be greater than or equal to 0')
        );
      });
    });

    describe('When path is not a valid string', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        const invalidPath = 42;

        await expect(
          consumeProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: CHAIN_CONFIG['134'].sharingContractAddress,
            protectedData: getRandomAddress(),
            app: getRandomAddress(),
            // @ts-expect-error Type 'number' is not assignable to type 'string'
            path: invalidPath,
          })
        ).rejects.toThrow(new ValidationError('path should be a string'));
      });
    });
  });
});
