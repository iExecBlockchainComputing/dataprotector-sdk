import { describe, it, beforeEach, expect } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { ValidationError } from '../../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  deployRandomApp,
  getRandomAddress,
} from '../../test-utils.js';

describe('dataProtector.fetchGrantedAccess()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  // todo: mock the stack (this test currently runs on the prod stack)
  it('pass with valid input', async () => {
    const res = await dataProtector.fetchGrantedAccess({});
    expect(res).toBeDefined();
  }, 10_000);

  it('accept an optional protectedData to filter only access to a specific protectedData', async () => {
    const protectedData = getRandomAddress();
    const { grantedAccess: res } = await dataProtector.fetchGrantedAccess({
      protectedData,
    });
    expect(res).toBeDefined();
    res.forEach((grantedAccess) => {
      expect(grantedAccess.dataset).toBe(protectedData);
    });
  }, 10_000);

  it('accept an optional authorizedApp to filter only access granted to a specific app (including wildcards access)', async () => {
    const authorizedApp = getRandomAddress();
    const { grantedAccess: res } = await dataProtector.fetchGrantedAccess({
      authorizedApp,
    });
    expect(res).toBeDefined();
    res.forEach((grantedAccess) => {
      expect(
        grantedAccess.apprestrict === authorizedApp ||
          grantedAccess.apprestrict ===
            '0x0000000000000000000000000000000000000000'
      ).toBe(true);
    });
  }, 10_000);

  it('accept an optional authorizedUser to filter only access granted to a specific user (including wildcards access)', async () => {
    const authorizedUser = getRandomAddress();
    const { grantedAccess: res } = await dataProtector.fetchGrantedAccess({
      authorizedUser,
    });
    expect(res).toBeDefined();
    expect(res).toBeDefined();
    res.forEach((grantedAccess) => {
      expect(
        grantedAccess.requesterrestrict === authorizedUser ||
          grantedAccess.requesterrestrict ===
            '0x0000000000000000000000000000000000000000'
      ).toBe(true);
    });
  }, 10_000);

  it('checks protectedData is an address or ENS or "any"', async () => {
    await expect(
      dataProtector.fetchGrantedAccess({
        protectedData: 'foo',
      })
    ).rejects.toThrow(
      new ValidationError(
        'protectedData should be an ethereum address, a ENS name, or "any"'
      )
    );
  });

  it('checks authorizedApp is an address or ENS or "any"', async () => {
    await expect(
      dataProtector.fetchGrantedAccess({
        protectedData: getRandomAddress(),
        authorizedApp: 'foo',
      })
    ).rejects.toThrow(
      new ValidationError(
        'authorizedApp should be an ethereum address, a ENS name, or "any"'
      )
    );
  });

  it('checks authorizedUser is an address or ENS or "any"', async () => {
    await expect(
      dataProtector.fetchGrantedAccess({
        protectedData: getRandomAddress(),
        authorizedUser: 'foo',
      })
    ).rejects.toThrow(
      new ValidationError(
        'authorizedUser should be an ethereum address, a ENS name, or "any"'
      )
    );
  });

  it(
    'should correctly create a protectedData, grant access, and fetch access for protected data',
    async () => {
      const userWalletAddress = Wallet.createRandom().address;
      const [protectedData, sconeAppAddress] = await Promise.all([
        dataProtector.protectData({
          data: { doNotUse: 'test' },
        }),
        deployRandomApp({ teeFramework: 'scone' }),
      ]);
      const grantedAccess = await dataProtector.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        authorizedUser: userWalletAddress,
      });
      const { grantedAccess: fetchedContacts } =
        await dataProtector.fetchGrantedAccess({
          protectedData: protectedData.address,
          authorizedApp: sconeAppAddress,
          authorizedUser: userWalletAddress,
        });
      const result = fetchedContacts.filter(
        (contact) =>
          contact.apprestrict.toLowerCase() === sconeAppAddress.toLowerCase() &&
          contact.requesterrestrict.toLowerCase() ===
            userWalletAddress.toLowerCase()
      );
      expect(result[0]).toEqual(grantedAccess);
    },
    5 * MAX_EXPECTED_BLOCKTIME
  );
});
