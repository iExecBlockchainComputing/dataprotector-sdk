import { describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec, utils } from 'iexec';
import { Collection } from '../../../src/index.js';
import { type RemoveCollection } from '../../../src/lib/dataProtectorSharing/removeCollection.js';
import { ValidationError, WorkflowError } from '../../../src/utils/errors.js';
import {
  getRandomAddress,
  getRandomTxHash,
  getRequiredFieldMessage,
} from '../../test-utils.js';

// Default sharing smart contract mock that can be customized in each test
jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js',
  () => ({
    getSharingContract: jest.fn<any>().mockResolvedValue({
      collectionDetails: () =>
        Promise.resolve({
          size: 0,
          subscriptionParams: {},
        } as Collection),
      ownerOf: () => Promise.resolve(getRandomAddress()),
      getApproved: () => Promise.resolve(undefined),
      isApprovedForAll: () => Promise.resolve(undefined),
      burn: () =>
        Promise.resolve({
          hash: getRandomTxHash(), // <-- Return a valid tx hash
          wait: jest.fn(),
        }),
    }),
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
      // --- GIVEN
      const { getSharingContract } = (await import(
        '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js'
      )) as {
        getSharingContract: jest.Mock<() => Promise<any>>;
      };
      getSharingContract.mockResolvedValue({
        collectionDetails: () =>
          Promise.resolve({
            size: 0, // <-- No protected data in the collection
            subscriptionParams: {},
          } as Collection),
        ownerOf: () => Promise.resolve(wallet.getAddress()), // <-- Requester is the collection owner
        getApproved: () => Promise.resolve(undefined),
        isApprovedForAll: () => Promise.resolve(undefined),
        burn: () =>
          Promise.resolve({
            hash: getRandomTxHash(), // <-- Return a valid tx hash
            wait: jest.fn(),
          }),
      });

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

  describe('When collection still has protected data', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- WHEN
      const { getSharingContract } = (await import(
        '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js'
      )) as {
        getSharingContract: jest.Mock<() => Promise<any>>;
      };
      getSharingContract.mockResolvedValue({
        collectionDetails: () =>
          Promise.resolve({
            size: 2, // <-- Still 2 protected data in the collection
            subscriptionParams: {},
          } as Collection),
        ownerOf: () => Promise.resolve(wallet.getAddress()),
        getApproved: () => Promise.resolve(undefined),
        isApprovedForAll: () => Promise.resolve(undefined),
      });

      await expect(
        // --- WHEN
        removeCollection({
          iexec,
          sharingContractAddress: getRandomAddress(),
          collectionId: 123,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to remove collection',
          errorCause: Error(
            'Collection still has protected data. Please empty the collection first by calling removeFromCollection for each protected data.'
          ),
        })
      );
    });
  });

  describe('When the requester is not the collection owner', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- WHEN
      const { getSharingContract } = (await import(
        '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js'
      )) as {
        getSharingContract: jest.Mock<() => Promise<any>>;
      };
      getSharingContract.mockResolvedValue({
        collectionDetails: () =>
          Promise.resolve({
            size: 0,
            subscriptionParams: {},
          } as Collection),
        ownerOf: () => Promise.resolve(getRandomAddress()), // <-- A random address here
        getApproved: () => Promise.resolve(undefined),
        isApprovedForAll: () => Promise.resolve(undefined),
      });

      await expect(
        // --- WHEN
        removeCollection({
          iexec,
          sharingContractAddress: getRandomAddress(),
          collectionId: 123,
        })
        // --- THEN
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to remove collection',
          errorCause: Error("This collection can't be managed by you."),
        })
      );
    });
  });
});
