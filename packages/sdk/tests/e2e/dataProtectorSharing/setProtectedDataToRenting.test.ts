import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import { timeouts } from '../../test-utils.js';

describe('dataProtector.setProtectedDataToRenting()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling setProtectedDataToRenting()', () => {
    it(
      'should answer with success true',
      async () => {
        const result = await dataProtector.dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionTokenId } =
          await dataProtector.dataProtectorSharing.createCollection();
        const onStatusUpdateMock = jest.fn();

        await dataProtector.dataProtectorSharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
          onStatusUpdate: onStatusUpdateMock,
        });

        const { success } =
          await dataProtector.dataProtectorSharing.setProtectedDataToRenting({
            protectedDataAddress: result.address,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          });
        expect(success).toBe(true);
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.setProtectedDataToRenting
    );

    it(
      'should fail with not collection owner error',
      async () => {
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

        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );

        await expect(() =>
          dataProtector1.dataProtectorSharing.setProtectedDataToRenting({
            protectedDataAddress: result.address,
            priceInNRLC: 100,
            durationInSeconds: 2000,
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
      'should fail if protected data does not exist',
      async () => {
        const protectedDataAddressMock = Wallet.createRandom().address;

        await dataProtector.dataProtectorSharing.createCollection();

        //to simulate the error we won't add the protected data to the collection

        await expect(() =>
          dataProtector.dataProtectorSharing.setProtectedDataToRenting({
            protectedDataAddress: protectedDataAddressMock,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          })
        ).rejects.toThrow(
          new WorkflowError(
            'This collection does not seem to exist or it has been burned.'
          )
        );
      },
      timeouts.createCollection + timeouts.setProtectedDataToRenting
    );
  });
});
