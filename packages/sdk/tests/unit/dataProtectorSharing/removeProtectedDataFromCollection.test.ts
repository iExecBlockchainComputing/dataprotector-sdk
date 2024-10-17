import { describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec, utils } from 'iexec';
import { Collection } from '../../../src/index.js';
import { type RemoveProtectedDataFromCollection } from '../../../src/lib/dataProtectorSharing/removeProtectedDataFromCollection.js';
import { ValidationError } from '../../../src/utils/errors.js';
import {
  getRandomAddress,
  getRandomTxHash,
  getRequiredFieldMessage,
} from '../../test-utils.js';

// Default sharing smart contract mock that can be customized in each test
jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js',
  () => ({
    getSharingContract: jest.fn(),
  })
);

describe('dataProtectorSharing.removeProtectedDataFromCollection()', () => {
  let testedModule: any;
  let wallet: HDNodeWallet;
  let iexec: IExec;
  let removeProtectedDataFromCollection: RemoveProtectedDataFromCollection;

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
      '../../../src/lib/dataProtectorSharing/removeProtectedDataFromCollection.js'
    );
    removeProtectedDataFromCollection =
      testedModule.removeProtectedDataFromCollection;
  });

  describe('Check validation for input parameters', () => {
    describe('When protected data address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingProtectedDataAddress = undefined;

        await expect(
          // --- WHEN
          removeProtectedDataFromCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
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
          removeProtectedDataFromCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
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
  });

  // TODO
  // describe('When the protected data does NOT exist', () => {});

  describe('When the protected data is not part of a collection', () => {
    it('should throw a WorkflowError with the correct message', async () => {
      // --- GIVEN
      const { getSharingContract } = (await import(
        '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js'
      )) as {
        getSharingContract: jest.Mock<() => Promise<any>>;
      };
      getSharingContract.mockResolvedValue({
        protectedDataDetails: () => Promise.resolve({ collection: BigInt(0) }), // <-- No collection
      });

      const protectedDataAddress = getRandomAddress().toLowerCase();

      await expect(
        // --- WHEN
        removeProtectedDataFromCollection({
          iexec,
          sharingContractAddress: getRandomAddress(),
          protectedData: protectedDataAddress,
        })
        // --- THEN
      ).rejects.toThrow(
        new Error(
          `The protected data is not a part of a collection: ${protectedDataAddress}`
        )
      );
    });
  });

  describe('When calling removeProtectedDataFromCollection() with valid inputs', () => {
    it('should work and answer with a transaction hash', async () => {
      // --- GIVEN
      const { getSharingContract } = (await import(
        '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js'
      )) as {
        getSharingContract: jest.Mock<() => Promise<any>>;
      };
      getSharingContract.mockResolvedValue({
        protectedDataDetails: () =>
          Promise.resolve({
            collection: BigInt(12),
            rentingParams: {},
            sellingParams: {},
          }),
        getCollectionSubscriber: () => Promise.resolve(BigInt(Date.now())),
        collectionDetails: () =>
          Promise.resolve({
            size: 0,
            subscriptionParams: {},
          } as Collection),
        ownerOf: () => Promise.resolve(getRandomAddress()),
        getApproved: () => Promise.resolve(getRandomAddress().toLowerCase()),
        isApprovedForAll: () => Promise.resolve(true),
        removeProtectedDataFromCollection: () =>
          Promise.resolve({
            hash: getRandomTxHash(),
            wait: () => Promise.resolve(undefined),
          }),
      });

      // --- WHEN
      const { txHash } = await removeProtectedDataFromCollection({
        iexec,
        sharingContractAddress: getRandomAddress(),
        protectedData: getRandomAddress(),
      });

      // --- THEN
      expect(txHash).toEqual(expect.any(String));
    });
  });
});
