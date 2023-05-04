import { describe, it, beforeEach, expect } from '@jest/globals';
import { IExecDataProtector } from '../../../dist/index';
import { ValidationError } from '../../../dist/utils/errors';
import { Wallet } from 'ethers';
import { getEthProvider } from './test-utils';

describe('dataProtector.fetchProtectedData()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getEthProvider(wallet.privateKey));
  });

  // todo: mock the stack (this test currently runs on the prod stack)
  it('pass with valid input', async () => {
    const res = await dataProtector.fetchProtectedData();
    expect(res).toBeDefined();
  }, 30_000);

  it('accept an optional requiredSchema', async () => {
    const res = await dataProtector.fetchProtectedData({
      requiredSchema: { foo: 'string' },
    });
    expect(res).toBeDefined();
  }, 30_000);

  it('accept an optional owner (address)', async () => {
    const res = await dataProtector.fetchProtectedData({
      owner: '0x027740b43e632439f100301d111d5c6954675235',
    });
    expect(res).toBeDefined();
  }, 30_000);

  it('accept an optional owner (array of address)', async () => {
    const res = await dataProtector.fetchProtectedData({
      owner: ['0x027740b43e632439f100301d111d5c6954675235'],
    });
    expect(res).toBeDefined();
  }, 30_000);

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

  it('checks owner is an address or array of addresses', async () => {
    await expect(
      dataProtector.fetchProtectedData({ owner: 'not an address' })
    ).rejects.toThrow(
      new ValidationError('owner should be an ethereum address')
    );
    await expect(
      dataProtector.fetchProtectedData({
        owner: ['0x027740b43e632439f100301d111d5c6954675235', 'not an address'],
      })
    ).rejects.toThrow(
      new ValidationError('owner[1] should be an ethereum address')
    );
  });
});
