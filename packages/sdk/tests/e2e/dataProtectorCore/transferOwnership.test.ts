import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtectorCore, ProtectedData } from '../../../src/index.js';
import { ValidationError, WorkflowError } from '../../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  getTestConfig,
  timeouts,
} from '../../test-utils.js';

describe('dataProtectorCore.transferOwnership()', () => {
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedData;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    protectedData = await dataProtectorCore.protectData({
      data: { doNotUse: 'test' },
    });
  }, timeouts.protectData);

  it(
    'should transfer protectedData ownership successfully',
    async () => {
      const newOwner = Wallet.createRandom().address;
      const address = protectedData.address;
      const transferResponse = await dataProtectorCore.transferOwnership({
        protectedData: address,
        newOwner,
      });
      expect(transferResponse.txHash).toBeDefined();
      expect(transferResponse.address).toBe(address);
      expect(transferResponse.to).toBe(newOwner);
    },
    2 * MAX_EXPECTED_BLOCKTIME + 5_000
  );

  it(
    'should throw when the requester of transfer is not the ownership of the protectedData',
    async () => {
      const newOwner = Wallet.createRandom().address;
      const notValidProtectedData = Wallet.createRandom().address;
      await expect(
        dataProtectorCore.transferOwnership({
          protectedData: notValidProtectedData,
          newOwner,
        })
      ).rejects.toThrow(
        new WorkflowError({
          message: 'Failed to transfer protectedData ownership',
          errorCause: Error('Invalid dataset address'),
        })
      );
    },
    2 * MAX_EXPECTED_BLOCKTIME
  );
});
