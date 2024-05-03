import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';
import { approveCollectionContract } from '../../../src/lib/dataProtectorSharing/smartContract/approveCollectionContract.js';
import { IExec } from 'iexec';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';

describe('dataProtector.addToCollection()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let addOnlyAppWhitelist: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    const addOnlyAppWhitelistResponse =
      await dataProtector.sharing.createAddOnlyAppWhitelist();
    addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;
  });

  describe('When calling addToCollection() with valid inputs', () => {
    it(
      'should work',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtector.core.protectData(
          {
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          }
        );

        const { collectionId } = await dataProtector.sharing.createCollection();

        const onStatusUpdateMock = jest.fn();

        // --- WHEN
        await dataProtector.sharing.addToCollection({
          collectionId,
          addOnlyAppWhitelist,
          protectedData,
          onStatusUpdate: onStatusUpdateMock,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
          isDone: true,
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection
    );

    it.only(
      'should work, if the protectedData has already been approved to the ProtectedDataSharing Contract',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtector.core.protectData(
          {
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          }
        );

        const { collectionId } = await dataProtector.sharing.createCollection();

        const onStatusUpdateMock = jest.fn();
        const [ethProvider, options] = getTestConfig(wallet.privateKey);
        const iexec = new IExec(
          { ethProvider },
          { ipfsGatewayURL: options.ipfsGateway, ...options?.iexecOptions }
        );
        await approveCollectionContract({
          iexec,
          protectedData,
          sharingContractAddress: DEFAULT_SHARING_CONTRACT_ADDRESS,
        });

        // --- WHEN
        await dataProtector.sharing.addToCollection({
          collectionId,
          addOnlyAppWhitelist,
          protectedData,
          onStatusUpdate: onStatusUpdateMock,
        });

        // --- THEN
        expect(onStatusUpdateMock).toHaveBeenCalledWith({
          title: 'ADD_PROTECTED_DATA_TO_COLLECTION',
          isDone: true,
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection
    );
  });

  describe('When the given protected data does NOT exist', () => {
    it(
      'should throw an error',
      async () => {
        // --- GIVEN
        const protectedDataThatDoesNotExist =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        const { collectionId } = await dataProtector.sharing.createCollection();

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId,
            addOnlyAppWhitelist,
            protectedData: protectedDataThatDoesNotExist,
          })
        ).rejects.toThrow(
          new Error(
            'This protected data does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.addToCollection
    );
  });

  describe('When the given collection does NOT exist', () => {
    it(
      'should throw an error',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtector.core.protectData(
          {
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          }
        );

        // Increment this value as needed
        const collectionIdThatDoesNotExist = 9999999;

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId: collectionIdThatDoesNotExist,
            addOnlyAppWhitelist,
            protectedData,
          })
        ).rejects.toThrow(
          new Error(
            'This collection does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.protectData + timeouts.addToCollection
    );
  });

  describe('When the given protected data address is not a valid address', () => {
    it(
      'should throw protectedData should be an ethereum address or a ENS name error',
      async () => {
        // --- GIVEN
        const invalidProtectedData = '0x123...';

        const { collectionId } = await dataProtector.sharing.createCollection();

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId: collectionId,
            protectedData: invalidProtectedData,
            addOnlyAppWhitelist,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.protectData + timeouts.addToCollection
    );
    it(
      'should throw validation error when an invalid ens is passed',
      async () => {
        // --- GIVEN
        const invalidENS = 'invalid.ens.name';
        const { collectionId } = await dataProtector.sharing.createCollection();

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId: collectionId,
            addOnlyAppWhitelist,
            protectedData: invalidENS,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.addToCollection
    );

    it(
      'should throw error when not a protected Data address is passed',
      async () => {
        // --- GIVEN
        const addressNotAProtectedData = await Wallet.createRandom().address;
        const { collectionId } = await dataProtector.sharing.createCollection();

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId: collectionId,
            addOnlyAppWhitelist,
            protectedData: addressNotAProtectedData,
          })
        ).rejects.toThrow(
          new Error(
            'This protected data does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.addToCollection
    );
  });

  describe('When passed invalid appAddress', () => {
    it(
      'should throw an error when an invalid dapp address is passed',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtector.core.protectData(
          {
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          }
        );
        const { collectionId } = await dataProtector.sharing.createCollection();
        const invalidDappAddress = 'invalidaddress';
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId,
            protectedData,
            addOnlyAppWhitelist: invalidDappAddress,
          })
        ).rejects.toThrow('addOnlyAppWhitelist should be an ethereum address');
      },
      timeouts.addToCollection
    );

    it(
      'should throw an error when a dapp address do not exist is passed',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtector.core.protectData(
          {
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          }
        );
        const { collectionId } = await dataProtector.sharing.createCollection();
        const DappAddressThatDoNotExist =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        //TODO: have an explicit message that dapp dosn't exist
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId,
            protectedData,
            addOnlyAppWhitelist: DappAddressThatDoNotExist,
          })
        ).rejects.toThrow('Failed to add protected data to collection');
      },
      timeouts.addToCollection
    );
    it(
      'should throw an error when an invalid ens is passed',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtector.core.protectData(
          {
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          }
        );
        const { collectionId } = await dataProtector.sharing.createCollection();
        const invalidDappENS = 'invalid.ens.name';
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId,
            protectedData,
            addOnlyAppWhitelist: invalidDappENS,
          })
        ).rejects.toThrow('addOnlyAppWhitelist should be an ethereum address');
      },
      timeouts.addToCollection
    );

    it(
      'should throw an error when an ens do not exist',
      async () => {
        // --- GIVEN
        const { address: protectedData } = await dataProtector.core.protectData(
          {
            data: { doNotUse: 'test' },
            name: 'test addToCollection',
          }
        );
        const { collectionId } = await dataProtector.sharing.createCollection();
        const invalidDappENS = 'ens.name.do.not.exist.eth';
        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addToCollection({
            collectionId,
            protectedData,
            addOnlyAppWhitelist: invalidDappENS,
          })
        ).rejects.toThrow('addOnlyAppWhitelist should be an ethereum address');
      },
      timeouts.addToCollection
    );
  });
});
