import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.setProtectedDataToRenting()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let addOnlyAppWhitelist: string;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    const addOnlyAppWhitelistResponse =
      await dataProtector.sharing.createAddOnlyAppWhitelist();
    addOnlyAppWhitelist = addOnlyAppWhitelistResponse.addOnlyAppWhitelist;
  });

  describe('When calling setProtectedDataToRenting()', () => {
    it(
      'should answer with success true',
      async () => {
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();
        const onStatusUpdateMock = jest.fn();

        await dataProtector.sharing.addToCollection({
          protectedData: result.address,
          addOnlyAppWhitelist,
          collectionId,
          onStatusUpdate: onStatusUpdateMock,
        });

        const setProtectedDataToRentingResult =
          await dataProtector.sharing.setProtectedDataToRenting({
            protectedData: result.address,
            price: 100,
            duration: 2000,
          });
        expect(setProtectedDataToRentingResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting
    );

    it(
      'should fail with not collection owner error',
      async () => {
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          protectedData: result.address,
          addOnlyAppWhitelist,
          collectionId,
        });

        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          ...getTestConfig(wallet1.privateKey)
        );

        await expect(() =>
          dataProtector1.sharing.setProtectedDataToRenting({
            protectedData: result.address,
            price: 100,
            duration: 2000,
          })
        ).rejects.toThrow(
          new WorkflowError("This collection can't be managed by you.")
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting
    );

    it(
      'should fail if the protected data is not a part of a collection',
      async () => {
        const protectedDataThatDoesNotExist =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        //to simulate the error we won't add the protected data to the collection

        await expect(() =>
          dataProtector.sharing.setProtectedDataToRenting({
            protectedData: protectedDataThatDoesNotExist,
            price: 100,
            duration: 2000,
          })
        ).rejects.toThrow(
          new WorkflowError(
            `The protected data is not a part of a collection: ${protectedDataThatDoesNotExist}`
          )
        );
      },
      timeouts.createCollection + timeouts.setProtectedDataToRenting
    );

    it(
      'should throw an error when protected data is for sale',
      async () => {
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();
        const onStatusUpdateMock = jest.fn();

        await dataProtector.sharing.addToCollection({
          protectedData: result.address,
          addOnlyAppWhitelist,
          collectionId,
          onStatusUpdate: onStatusUpdateMock,
        });

        await dataProtector.sharing.setProtectedDataForSale({
          price: 100,
          protectedData: result.address,
        });

        await expect(
          dataProtector.sharing.setProtectedDataToRenting({
            protectedData: result.address,
            price: 100,
            duration: 2000,
          })
        ).rejects.toThrow(
          new Error(
            'This protected data is currently available for sale. First call removeProtectedDataForSale()'
          )
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting
    );
  });

  describe('When the given protected data address is not a valid address', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const invalidProtectedData = '0x123...';

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.setProtectedDataToRenting({
            protectedData: invalidProtectedData,
            price: 100,
            duration: 2000,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.setProtectedDataToRenting
    );
  });
});
