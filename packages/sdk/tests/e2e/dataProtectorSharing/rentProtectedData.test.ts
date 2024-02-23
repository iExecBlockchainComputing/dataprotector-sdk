import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.rentProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling rentProtectedData()', () => {
    it(
      'should answer with success true',
      async () => {
        // --- GIVEN
        const result = await dataProtector.dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();

        await dataProtector.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });

        await dataProtector.dataProtectorSharing.setProtectedDataToRenting({
          protectedDataAddress: result.address,
          priceInNRLC: 0,
          durationInSeconds: 2000,
        });

        // --- WHEN
        const { success } =
          await dataProtector.dataProtectorSharing.rentProtectedData({
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
