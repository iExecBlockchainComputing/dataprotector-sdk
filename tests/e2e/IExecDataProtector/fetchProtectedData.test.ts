import { describe, it, beforeEach, expect } from '@jest/globals';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { ValidationError } from '../../../src/utils/errors.js';
import { HDNodeWallet, Wallet } from 'ethers';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.fetchProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  // todo: mock the stack (this test currently runs on the prod stack)
  it(
    'pass with valid input',
    async () => {
      const res = await dataProtector.fetchProtectedData();
      expect(res).toBeDefined();
    },
    5 * MAX_EXPECTED_BLOCKTIME // should fit in default timeout after [PRO-149] fix
  );

  it(
    'accept an optional requiredSchema',
    async () => {
      const res = await dataProtector.fetchProtectedData({
        requiredSchema: { foo: 'string' },
      });
      expect(res).toBeDefined();
    },
    5 * MAX_EXPECTED_BLOCKTIME // should fit in default timeout after [PRO-149] fix
  );

  it(
    'accept an optional owner (address)',
    async () => {
      const res = await dataProtector.fetchProtectedData({
        owner: '0x027740b43e632439f100301d111d5c6954675235',
      });
      expect(res).toBeDefined();
    },
    5 * MAX_EXPECTED_BLOCKTIME // should fit in default timeout after [PRO-149] fix
  );

  it('checks requiredSchema is valid', async () => {
    const invalidSchema: any = { foo: 'bar' };
    await expect(
      dataProtector.fetchProtectedData({ requiredSchema: invalidSchema })
    ).rejects.toThrow(
      new ValidationError(
        'schema is not valid: Unsupported type "bar" in schema'
      )
    );
  });

  it('checks owner is an address', async () => {
    await expect(
      dataProtector.fetchProtectedData({ owner: 'not an address' })
    ).rejects.toThrow(
      new ValidationError('owner should be an ethereum address')
    );
  });
});
