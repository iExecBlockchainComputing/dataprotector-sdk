import { beforeEach, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.removeProtectedDataFromRenting()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
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
      'should fail if the protected data is not a part of a collection',
      async () => {
        //create a random protected data address
        const protectedDataAddressThatDoesNotExist =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          ...getTestConfig(wallet1.privateKey)
        );

        await expect(() =>
          dataProtector1.dataProtectorSharing.removeProtectedDataFromRenting({
            protectedDataAddress: protectedDataAddressThatDoesNotExist,
          })
        ).rejects.toThrow(
          new WorkflowError(
            `The protected data is not a part of a collection: ${protectedDataAddressThatDoesNotExist}`
          )
        );
      },
      timeouts.createCollection
    );
  });
});
