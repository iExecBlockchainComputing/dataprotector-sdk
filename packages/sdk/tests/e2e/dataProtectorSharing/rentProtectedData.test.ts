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

        const { collectionTokenId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });

        await dataProtectorCreator.sharing.setProtectedDataToRenting({
          protectedDataAddress: result.address,
          priceInNRLC: 0,
          durationInSeconds: 2000,
        });

        // --- WHEN
        const rentProtectedDataResult =
          await dataProtectorEndUser.sharing.rentProtectedData({
            protectedDataAddress: result.address,
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

        const { collectionTokenId } =
          await dataProtectorCreator.sharing.createCollection();

        await dataProtectorCreator.sharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });

        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.rentProtectedData({
            protectedDataAddress: result.address,
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
        const invalidProtectedDataAddress = '0x123...';

        // --- WHEN / THEN
        await expect(
          dataProtectorEndUser.sharing.rentProtectedData({
            protectedDataAddress: invalidProtectedDataAddress,
          })
        ).rejects.toThrow(
          new Error(
            'protectedDataAddress should be an ethereum address or a ENS name'
          )
        );
      },
      timeouts.rentProtectedData
    );
  });
});
