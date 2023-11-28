import { beforeEach, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { ValidationError } from '../../../src/utils/errors.js';
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
  it('pagination: fetches the first 1000 items by default', async () => {
    const res = await dataProtector.fetchProtectedData();
    expect(res.length).toBe(1000);
  });
  it('pagination: fetches a specific page with a specified page size', async () => {
    const page = 2; // Specify the desired page number
    const pageSize = 50; // Specify the desired page size
    const res = await dataProtector.fetchProtectedData({ page, pageSize });

    // Check if the correct number of items for the specified page size is retrieved
    expect(res.length).toBe(50);
    // TODO: implement logic to ensure that the items are from the desired page.
  });
  it('pagination: handles invalid page numbers gracefully', async () => {
    const page = -1; // Invalid page number
    const pageSize = 50; // Specify a valid page size
    await expect(
      dataProtector.fetchProtectedData({ page, pageSize })
    ).rejects.toThrow(
      new ValidationError('page must be greater than or equal to 0')
    );
  });

  it('pagination: handles large page numbers correctly', async () => {
    const page = 10000; // Large page number
    const pageSize = 50; // Specify a valid page size
    const res = await dataProtector.fetchProtectedData({ page, pageSize });

    // Check if the response is empty
    expect(res).toStrictEqual([]);
  });

  it('pagination: handles large page sizes correctly', async () => {
    const page = 1; // Specify a valid page number
    const pageSize = 10000; // large page size

    await expect(
      dataProtector.fetchProtectedData({ page, pageSize })
    ).rejects.toThrow(
      new ValidationError('pageSize must be less than or equal to 1000')
    );
  });
});
