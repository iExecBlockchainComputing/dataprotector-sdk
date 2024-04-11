import { beforeEach, describe, expect, it } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import { getTestConfig, timeouts } from '../../test-utils.js';

describe('dataProtector.removeProtectedDataFromRenting()', () => {
  let dataProtector: IExecDataProtector;
  let dataProtector1: IExecDataProtector;
  let wallet: HDNodeWallet;
  let wallet1: HDNodeWallet;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    wallet1 = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    dataProtector1 = new IExecDataProtector(
      ...getTestConfig(wallet1.privateKey)
    );
  });

  describe('When calling removeProtectedDataFromRenting()', () => {
    it(
      'should answer with success true',
      async () => {
        // --- GIVEN
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          protectedData: result.address,
          collectionId,
        });

        await dataProtector.sharing.setProtectedDataToRenting({
          protectedData: result.address,
          priceInNRLC: 100,
          durationInSeconds: 2000,
        });

        // --- WHEN
        const removeProtectedDataFromRentingResult =
          await dataProtector.sharing.removeProtectedDataFromRenting({
            protectedData: result.address,
          });

        // --- THEN
        expect(removeProtectedDataFromRentingResult).toEqual({
          txHash: expect.any(String),
        });
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
        const protectedDataThatDoesNotExist =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        await expect(() =>
          dataProtector1.sharing.removeProtectedDataFromRenting({
            protectedData: protectedDataThatDoesNotExist,
          })
        ).rejects.toThrow(
          new WorkflowError(
            `The protected data is not a part of a collection: ${protectedDataThatDoesNotExist}`
          )
        );
      },
      timeouts.createCollection
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
          dataProtector.sharing.removeProtectedDataFromRenting({
            protectedData: invalidProtectedData,
          })
        ).rejects.toThrow(
          new Error('protectedData should be an ethereum address or a ENS name')
        );
      },
      timeouts.removeProtectedDataFromRenting
    );
  });

  describe('When the given protected data is not for rent', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          protectedData: result.address,
          collectionId,
        });

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.removeProtectedDataFromRenting({
            protectedData: result.address,
          })
        ).rejects.toThrow(
          new Error('This protected data is not available for renting.')
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.removeProtectedDataFromRenting
    );
  });

  describe('When the given wallet is not collection owner', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        const result = await dataProtector.core.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });

        const { collectionId } = await dataProtector.sharing.createCollection();

        await dataProtector.sharing.addToCollection({
          protectedData: result.address,
          collectionId,
        });

        // --- WHEN / THEN
        await expect(
          dataProtector1.sharing.removeProtectedDataFromRenting({
            protectedData: result.address,
          })
        ).rejects.toThrow(
          new Error("This collection can't be managed by you.")
        );
      },
      timeouts.protectData +
        timeouts.createCollection +
        timeouts.addToCollection +
        timeouts.removeProtectedDataFromRenting
    );
  });
});
