import { describe, it, beforeEach, expect } from '@jest/globals';
import { IExecDataProtector, getWeb3Provider } from '../../../dist/index';
import { ValidationError } from '../../../dist/utils/errors';
import { Wallet } from 'ethers';
import { getRandomAddress } from '../../test-utils';

describe('dataProtector.fetchGrantedAccess()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  beforeEach(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  // todo: mock the stack (this test currently runs on the prod stack)
  it('pass with valid input', async () => {
    const res = await dataProtector.fetchGrantedAccess({
      protectedData: getRandomAddress(),
    });
    expect(res).toBeDefined();
  }, 10_000);

  it('accept an optional authorizedApp', async () => {
    const res = await dataProtector.fetchGrantedAccess({
      protectedData: getRandomAddress(),
      authorizedApp: getRandomAddress(),
    });
    expect(res).toBeDefined();
  }, 10_000);

  it('accept an optional authorizedUser', async () => {
    const res = await dataProtector.fetchGrantedAccess({
      protectedData: getRandomAddress(),
      authorizedUser: getRandomAddress(),
    });
    expect(res).toBeDefined();
  }, 10_000);

  it('checks protectedData is an address or ENS', async () => {
    await expect(
      dataProtector.fetchGrantedAccess({
        protectedData: 'foo',
      })
    ).rejects.toThrow(
      new ValidationError(
        'protectedData should be an ethereum address or a ENS name'
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
});
