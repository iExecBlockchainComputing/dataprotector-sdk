import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import {
  IExecDataProtector,
  ProtectedData,
  getWeb3Provider,
} from '../../../dist/index';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils';
import { ValidationError } from '../../../dist/utils/errors';

describe('dataProtector.transferOwnership()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  let protectedData: ProtectedData;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
    protectedData = await dataProtector.protectData({
      data: { doNotUse: 'test' },
    });
  }, 4 * MAX_EXPECTED_BLOCKTIME);

  it(
    'should transfer protectedData ownership successfully',
    async () => {
      const newOwner = Wallet.createRandom().address;
      const address = protectedData.address;
      const transferResponse = await dataProtector.transferOwnership({
        protectedData: address,
        newOwner,
      });
      expect(transferResponse.txHash).toBeDefined();
      expect(transferResponse.address).toBe(address);
      expect(transferResponse.to).toBe(newOwner);
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
  it(
    'should throw when the requester of transfer is not the ownership of the protectedData',
    async () => {
      const newOwner = Wallet.createRandom().address;
      const notValidProtectedData = Wallet.createRandom().address;
      await expect(
        dataProtector.transferOwnership({
          protectedData: notValidProtectedData,
          newOwner,
        })
      ).rejects.toThrow(
        new ValidationError('Failed to transfer protectedData ownership')
      );
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
});
