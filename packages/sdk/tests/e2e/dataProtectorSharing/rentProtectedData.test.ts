import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.rentProtectedData()', () => {
  let dataProtectorCreator: IExecDataProtector;
  let dataProtectorEndUser: IExecDataProtector;

  beforeAll(async () => {
    const walletCreator = Wallet.createRandom();
    const walletEndUser = Wallet.createRandom();
    dataProtectorCreator = new IExecDataProtector(
      ...getTestConfig(walletCreator.privateKey)
    );
    dataProtectorEndUser = new IExecDataProtector(
      ...getTestConfig(walletEndUser.privateKey)
    );
  });

  describe('When calling rentProtectedData()', () => {
    it(
      'should answer with success true',
      async () => {
        // --- GIVEN
        const result = await dataProtectorCreator.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          protectedData: result.address,
          collectionId,
        });
        const rentingParams = { price: 0, duration: 30 * 24 * 60 * 60 };
        await dataProtectorCreator.sharing.setProtectedDataToRenting({
          protectedData: result.address,
          ...rentingParams,
        });

        // --- WHEN
        const rentProtectedDataResult =
          await dataProtectorEndUser.sharing.rentProtectedData({
            protectedData: result.address,
            ...rentingParams,
          });

        // --- THEN
        expect(rentProtectedDataResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting +
        timeouts.rentProtectedData
    );
  });

  describe('When calling rentProtectedData() when Protected Data is not set to renting', () => {
    it(
      'should throw the corresponding error',
      async () => {
        // --- GIVEN
        const result = await dataProtectorCreator.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        const rentingParams = { price: 0, duration: 30 * 24 * 60 * 60 };

        const { collectionId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          protectedData: result.address,
          collectionId,
        });
        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.rentProtectedData({
            protectedData: result.address,
            ...rentingParams,
          })
        ).rejects.toThrow(
          new Error('This protected data is not available for renting.')
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.rentProtectedData
    );
  });

  describe('When the given protected data address is not a valid address', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const invalidProtectedData = '0x123...';
        const rentingParams = { price: 0, duration: 30 * 24 * 60 * 60 };

        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.rentProtectedData({
            protectedData: invalidProtectedData,
            ...rentingParams,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.rentProtectedData
    );
  });
});
