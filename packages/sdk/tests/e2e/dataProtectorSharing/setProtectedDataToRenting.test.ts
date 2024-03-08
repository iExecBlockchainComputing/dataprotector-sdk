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
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();
        const onStatusUpdateMock = jest.fn();

        await dataProtector.sharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
          onStatusUpdate: onStatusUpdateMock,
        });

        const setProtectedDataToRentingResult =
          await dataProtector.sharing.setProtectedDataToRenting({
            protectedDataAddress: result.address,
            priceInNRLC: 100,
            durationInSeconds: 2000,
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

        const { collectionTokenId } =
          await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          protectedDataAddress: result.address,
          collectionTokenId,
        });

        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );

        await expect(() =>
          dataProtector1.sharing.setProtectedDataToRenting({
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
      'should fail if the protected data is not a part of a collection',
      async () => {
        const protectedDataAddressThatDoesNotExist =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        //to simulate the error we won't add the protected data to the collection

        await expect(() =>
          dataProtector.sharing.setProtectedDataToRenting({
            protectedDataAddress: protectedDataAddressThatDoesNotExist,
            priceInNRLC: 100,
            durationInSeconds: 2000,
          })
        ).rejects.toThrow(
          new WorkflowError(
            `The protected data is not a part of a collection: ${protectedDataAddressThatDoesNotExist}`
          )
        );
      },
      timeouts.createCollection + timeouts.setProtectedDataToRenting
    );
  });
});
