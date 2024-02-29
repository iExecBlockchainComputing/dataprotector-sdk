import { beforeEach, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.removeProtectedDataFromRenting()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling removeProtectedDataFromRenting()', () => {
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
          priceInNRLC: 100,
          durationInSeconds: 2000,
        });

        // --- WHEN
        const { success } =
          await dataProtector.dataProtectorSharing.removeProtectedDataFromRenting(
            {
              protectedDataAddress: result.address,
            }
          );

        // --- THEN
        expect(success).toBe(true);
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting +
        timeouts.removeProtectedDataFromRenting
    );

    it(
      'should fail if the collection does not seem to exist or it has been burned',
      async () => {
        //create a random protected data address
        const protectedDataAddressMock = Wallet.createRandom().address;

        await dataProtector.dataProtectorSharing.createCollection();

        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );

        await expect(() =>
          dataProtector1.dataProtectorSharing.removeProtectedDataFromRenting({
            protectedDataAddress: protectedDataAddressMock,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'This collection does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.createCollection
    );
  });
});
