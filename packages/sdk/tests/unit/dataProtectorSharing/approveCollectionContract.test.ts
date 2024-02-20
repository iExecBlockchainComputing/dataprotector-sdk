import { describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExec } from 'iexec';
import { getWeb3Provider } from '../../../src/index.js';

describe('approveCollectionContract', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('when the protected data is already owned by the collection contract', () => {
    it('should not call the approve function', async () => {
      // --- GIVEN
      const getContractSpy = jest.fn();
      jest.unstable_mockModule(
        '../../../src/lib/dataProtector/sharing/smartContract/getPocoRegistryContract.js',
        () => {
          return {
            getPocoDatasetRegistryContract: getContractSpy,
          };
        }
      );

      const { approveCollectionContract } = await import(
        '../../../src/lib/dataProtectorSharing/smartContract/approveCollectionContract.js'
      );
      const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);
      const iexec = new IExec({
        ethProvider,
      });

      // --- WHEN
      await approveCollectionContract({
        iexec,
        protectedDataAddress: '...',
        protectedDataCurrentOwnerAddress: '0x2F...',
        sharingContractAddress: '0x2f...',
      }).catch(() => {
        // We are not interested in the eventual error
      });

      // --- THEN
      expect(getContractSpy).not.toHaveBeenCalled();
    });
  });

  describe('when the protected data is owned by someone else', () => {
    it('should call the smart-contract', async () => {
      // --- GIVEN
      const getContractSpy = jest
        .fn<() => Promise<object>>()
        .mockResolvedValue({
          approve: () => Promise.resolve(),
        });
      jest.unstable_mockModule(
        '../../../src/lib/dataProtector/sharing/smartContract/getPocoRegistryContract.js',
        () => {
          return {
            getPocoDatasetRegistryContract: getContractSpy,
          };
        }
      );

      const { approveCollectionContract } = await import(
        '../../../src/lib/dataProtectorSharing/smartContract/approveCollectionContract.js'
      );
      const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);
      const iexec = new IExec({
        ethProvider,
      });

      // --- WHEN
      await approveCollectionContract({
        iexec,
        protectedDataAddress: '0xc72e3fc8395f9410cc838bc1962b389229015ed5',
        protectedDataCurrentOwnerAddress: '0x7e...',
        sharingContractAddress: '0x2f...',
      }).catch(() => {
        // We are not interested in the eventual error
        // Should be something like: "TypeError: Cannot read properties of undefined (reading 'wait')"
      });

      // --- THEN
      expect(getContractSpy).toHaveBeenCalled();
    });
  });
});
