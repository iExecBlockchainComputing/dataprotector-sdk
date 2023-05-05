import { describe, it, expect, beforeAll } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../dist/index';
import { ValidationError } from '../../../dist/utils/errors';
import { getEthProvider, getRandomAddress } from '../../test-utils';

describe('dataProtector.revokeOneAccess()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getEthProvider(wallet.privateKey));
  }, 30_000);

  // todo: test "pass with a valid GrantedAccess" the standard case, this requires [PRO-126] grantAccess() to return a GrantedAccess)

  it('checks arg 0 is a required GrantedAccess', async () => {
    const undefinedInput: any = undefined;
    const grantedAccess: any = {
      dataset: getRandomAddress(),
      datasetprice: 0,
      volume: 1,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
      apprestrict: getRandomAddress(),
      workerpoolrestrict: getRandomAddress(),
      requesterrestrict: getRandomAddress(),
      salt: '0x0000000000000000000000000000000000000000000000000000000000000000',
      sign: '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
    await expect(dataProtector.revokeOneAccess(undefinedInput)).rejects.toThrow(
      new ValidationError('The GrantedAccess to revoke is required')
    );
    await expect(
      dataProtector.revokeOneAccess({ ...grantedAccess, dataset: 'foo' })
    ).rejects.toThrow(
      new ValidationError('dataset should be an ethereum address')
    );
  });
});
