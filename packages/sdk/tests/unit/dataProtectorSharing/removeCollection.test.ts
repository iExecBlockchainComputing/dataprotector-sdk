import { describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec, utils } from 'iexec';
import { type RemoveCollection } from '../../../src/lib/dataProtectorSharing/removeCollection.js';
import { ValidationError } from '../../../src/utils/errors.js';
import {
  getRandomAddress,
  getRandomTxHash,
  getRequiredFieldMessage,
} from '../../test-utils.js';

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js',
  () => ({
    getSharingContract: jest
      .fn<
        () => Promise<{
          burn: () => any;
        }>
      >()
      .mockResolvedValue({
        burn: () =>
          Promise.resolve({
            hash: getRandomTxHash(),
            wait: jest.fn(),
          }),
      }),
  })
);

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/sharingContract.reads.js',
  () => ({
    getCollectionDetails: jest.fn(),
  })
);

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/preflightChecks.js',
  () => ({
    onlyCollectionOperator: jest.fn(),
    onlyCollectionEmpty: jest.fn(),
  })
);

describe('dataProtectorSharing.removeCollection()', () => {
  let testedModule: any;
  let wallet: HDNodeWallet;
  let iexec: IExec;
  let removeCollection: RemoveCollection;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    iexec = new IExec({
      ethProvider: utils.getSignerFromPrivateKey(
        'https://bellecour.iex.ec',
        wallet.privateKey
      ),
    });

    // import tested module after all mocked modules
    testedModule = await import(
      '../../../src/lib/dataProtectorSharing/removeCollection.js'
    );
    removeCollection = testedModule.removeCollection;
  });

  describe('Check validation for input parameters', () => {
    describe('When collection id is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingCollectionId = undefined;

        await expect(
          // --- WHEN
          removeCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
            collectionId: missingCollectionId,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(getRequiredFieldMessage('collectionId'))
        );
      });
    });

    describe('When given collection id is a string', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidCollectionId = 'abc';

        await expect(
          // --- WHEN
          removeCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
            // @ts-expect-error This is intended to actually test yup runtime validation
            collectionId: invalidCollectionId,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('collectionId must be a non-negative number')
        );
      });
    });

    describe('When given collection id is a negative number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidCollectionId = -1;

        await expect(
          // --- WHEN
          removeCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
            collectionId: invalidCollectionId,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('collectionId must be greater than or equal to 0')
        );
      });
    });
  });

  describe('When sharing smart contract answers successfully with a transaction hash', () => {
    it('should answer with this transaction hash', async () => {
      // --- WHEN
      const removeCollectionResult = await removeCollection({
        iexec,
        sharingContractAddress: getRandomAddress(),
        collectionId: 123,
      });

      // --- THEN
      expect(removeCollectionResult).toEqual({
        txHash: expect.any(String),
      });
    });
  });
});
