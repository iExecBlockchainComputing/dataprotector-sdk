import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import {
  IExecDataProtector,
  ProtectedData,
  getWeb3Provider,
} from '../../src/index.js';
import { ValidationError } from '../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
} from '../test-utils.js';

describe('dataProtector.transferOwnership()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedData;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
    protectedData = await dataProtector.protectData({
      data: { doNotUse: 'test' },
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

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
    2 * MAX_EXPECTED_BLOCKTIME
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
    2 * MAX_EXPECTED_BLOCKTIME
  );
});
