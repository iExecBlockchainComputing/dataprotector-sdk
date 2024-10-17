import { describe, expect, it, jest } from '@jest/globals';
import { type HDNodeWallet, Wallet } from 'ethers';
import { IExec, utils } from 'iexec';
import { ValidationError } from 'yup';
import { type AddToCollection } from '../../../src/lib/dataProtectorSharing/addToCollection.js';
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
      // Functions called by onlyCollectionOperator()
      ownerOf: () => Promise.resolve(getRandomAddress()),
      getApproved: () => Promise.resolve(undefined),
      isApprovedForAll: () => Promise.resolve(undefined),
      // Functions called by onlyProtectedDataNotInCollection
      protectedDataDetails: () => Promise.resolve(undefined),
      // Function called directly by tested function: addToCollection
      addProtectedDataToCollection: () => Promise.resolve(undefined),
    }),
  })
);

// Default POCO registry smart contract mock that can be customized in each test
jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/getPocoRegistryContract.js',
  () => ({
    getPocoDatasetRegistryContract: jest.fn<any>().mockResolvedValue({
      // Functions called by approveProtectedDataForCollectionContract()
      getApproved: () => Promise.resolve(undefined),
    }),
  })
);

// Default app whitelist registry smart contract mock that can be customized in each test
jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/getAddOnlyAppWhitelistRegistryContract.ts',
  () => ({
    getAppWhitelistRegistryContract: jest.fn<any>().mockResolvedValue({
      ownerOf: () => Promise.resolve(undefined),
    }),
  })
);

describe('dataProtectorSharing.addToCollection()', () => {
  let testedModule: any;
  let wallet: HDNodeWallet;
  let iexec: IExec;
  let addToCollection: AddToCollection;

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
      '../../../src/lib/dataProtectorSharing/addToCollection.js'
    );
    addToCollection = testedModule.addToCollection;
  });

  describe('Check validation for input parameters', () => {
    describe('When collection id is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingCollectionId = undefined;

        await expect(
          // --- WHEN
          addToCollection({
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
          addToCollection({
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
          addToCollection({
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

    describe('When protected data address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingProtectedDataAddress = undefined;

        await expect(
          // --- WHEN
          addToCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
            collectionId: 12,
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
          addToCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
            collectionId: 12,
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

    describe('When app whitelist address is NOT given', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const missingAppWhitelistAddress = undefined;

        await expect(
          // --- WHEN
          addToCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
            collectionId: 12,
            protectedData: getRandomAddress(),
            addOnlyAppWhitelist: missingAppWhitelistAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(getRequiredFieldMessage('addOnlyAppWhitelist'))
        );
      });
    });

    describe('When given app whitelist address is NOT valid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAppWhitelistAddress = '0x789abc...';

        await expect(
          // --- WHEN
          addToCollection({
            // @ts-expect-error No need for iexec here
            iexec: {},
            sharingContractAddress: getRandomAddress(),
            collectionId: 12,
            protectedData: getRandomAddress(),
            addOnlyAppWhitelist: invalidAppWhitelistAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'addOnlyAppWhitelist should be an ethereum address'
          )
        );
      });
    });
  });

  describe('When calling addToCollection() with valid inputs', () => {
    it('should work and answer with a transaction hash', async () => {
      // --- GIVEN
      const sharingContractAddress = getRandomAddress().toLowerCase();

      const { getSharingContract } = (await import(
        '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js'
      )) as {
        getSharingContract: jest.Mock<() => Promise<any>>;
      };
      getSharingContract.mockResolvedValue({
        // Functions called by onlyCollectionOperator()
        ownerOf: () => Promise.resolve(wallet.getAddress()),
        getApproved: () => Promise.resolve(undefined),
        isApprovedForAll: () => Promise.resolve(undefined),
        // Function called by onlyProtectedDataNotInCollection
        protectedDataDetails: () => Promise.resolve({ collection: BigInt(0) }),
        // Function called directly by tested function: addToCollection
        addProtectedDataToCollection: () =>
          Promise.resolve({
            hash: getRandomTxHash(),
            wait: () =>
              Promise.resolve({
                logs: [
                  {
                    eventName: 'DatasetSchema',
                    args: { tokenId: 123 },
                  },
                ],
              }),
          }),
      });

      const { getPocoDatasetRegistryContract } = (await import(
        '../../../src/lib/dataProtectorSharing/smartContract/getPocoRegistryContract.js'
      )) as {
        getPocoDatasetRegistryContract: any;
      };
      getPocoDatasetRegistryContract.mockResolvedValue({
        // Functions called by approveProtectedDataForCollectionContract()
        getApproved: () => Promise.resolve(sharingContractAddress),
      });

      // --- WHEN
      const { txHash } = await addToCollection({
        iexec,
        sharingContractAddress,
        collectionId: 12,
        protectedData: getRandomAddress(),
        addOnlyAppWhitelist: getRandomAddress(),
      });

      // --- THEN
      expect(txHash).toEqual(expect.any(String));
    });
  });
});
