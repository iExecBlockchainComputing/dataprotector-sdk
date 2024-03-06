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
        const result = await dataProtectorCreator.dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionTokenId } =
          await dataProtectorCreator.dataProtectorSharing.createCollection();

        await dataProtectorCreator.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });

        await dataProtectorCreator.dataProtectorSharing.setProtectedDataToRenting(
          {
            protectedDataAddress: result.address,
            priceInNRLC: 0,
            durationInSeconds: 2000,
          }
        );

        // --- WHEN
        const { success } =
          await dataProtectorEndUser.dataProtectorSharing.rentProtectedData({
            protectedDataAddress: result.address,
          });

        // --- THEN
        expect(success).toBe(true);
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting +
        timeouts.rentProtectedData
    );
  });
});
