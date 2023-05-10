import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Wallet } from 'ethers';
import { ProtectedDataWithSecretProps } from '../../../dist/dataProtector/types';
import { IExecDataProtector } from '../../../dist/index';
import { ValidationError } from '../../../dist/utils/errors';
import { getEthProvider, getRandomAddress } from '../../test-utils';

describe('dataProtector.revokeOneAccess()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  let protectedData: ProtectedDataWithSecretProps;
  jest.setTimeout(60000);
  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getEthProvider(wallet.privateKey));
    protectedData = await dataProtector.protectData({
      data: { doNotUse: 'test' },
    });
  }, 30_000);
  let input: any;
  beforeEach(() => {
    input = {
      protectedData: protectedData.address,
      authorizedApp: getRandomAddress(),
      authorizedUser: getRandomAddress(),
    };
  });
  it('pass with a valid GrantedAccess', async () => {
    const grantedAccess = await dataProtector.grantAccess(input);
    await expect(
      dataProtector.revokeOneAccess(grantedAccess)
    ).resolves.toBeDefined();
  });

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
      new ValidationError('The GrantedAccess is required to be revoked')
    );
    await expect(
      dataProtector.revokeOneAccess({ ...grantedAccess, dataset: 'foo' })
    ).rejects.toThrow(
      new ValidationError('dataset should be an ethereum address')
    );
  });
});
