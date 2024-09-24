import { describe, expect, it } from '@jest/globals';
import { ValidationError } from 'yup';
import { WorkflowError } from '../../../src/index.js';
import { getCollectionsByOwner } from '../../../src/lib/dataProtectorSharing/getCollectionsByOwner.js';

describe('getCollectionsByOwner', () => {
  describe('Check validation for input parameters', () => {
    describe('When owner is undefined', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        await expect(
          // --- WHEN
          getCollectionsByOwner({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            owner: undefined,
            includeHiddenProtectedDatas: true,
          })
          // --- THEN
        ).rejects.toThrow(new ValidationError('owner is a required field'));
      });
    });

    describe('When the owner address is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidOwnerAddress = '0x123456...';

        await expect(
          // --- WHEN
          getCollectionsByOwner({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            owner: invalidOwnerAddress,
            includeHiddenProtectedDatas: false,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('owner should be an ethereum address')
        );
      });
    });

    describe('When includeHiddenProtectedDatas is not a boolean', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidIncludeHiddenProtectedDatas = 'notABoolean';

        await expect(
          // --- WHEN
          getCollectionsByOwner({
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            owner: '0x1234567890abcdef1234567890abcdef12345678',
            // @ts-expect-error Type 'string' is not assignable to type 'boolean'
            includeHiddenProtectedDatas: invalidIncludeHiddenProtectedDatas,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('includeHiddenProtectedDatas should be a boolean')
        );
      });
    });
  });

  describe('Check catch block', () => {
    describe('When graphQLClient is missing', () => {
      it('should throw a WorkflowError with isProtocolError: true', async () => {
        // --- GIVEN
        const ownerAddress = '0x1234567890abcdef1234567890abcdef12345678'; // Adresse valide

        await expect(
          // --- WHEN
          getCollectionsByOwner({
            // @ts-expect-error No need for iexec here
            graphQLClient: {},
            owner: ownerAddress,
            includeHiddenProtectedDatas: false,
          })
          // --- THEN
        ).rejects.toThrow(
          new WorkflowError({
            message: 'Failed to get collections by owner',
            errorCause: new Error('graphQLClient.request is not a function'),
            isProtocolError: true,
          })
        );
      });
    });
  });
});
