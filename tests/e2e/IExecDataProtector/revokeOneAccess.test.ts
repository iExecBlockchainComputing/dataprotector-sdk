import { beforeAll, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { ProtectedDataWithSecretProps } from '../../../dist/dataProtector/types';
import { IExecDataProtector, getWeb3Provider } from '../../../dist/index';
import { ValidationError } from '../../../dist/utils/errors';
import { MAX_EXPECTED_BLOCKTIME, getRandomAddress } from '../../test-utils';

describe('dataProtector.revokeOneAccess()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  let protectedData: ProtectedDataWithSecretProps;
  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
    protectedData = await dataProtector.protectData({
      data: { doNotUse: 'test' },
    });
  }, 2 * MAX_EXPECTED_BLOCKTIME);

  it(
    'pass with a valid GrantedAccess',
    async () => {
      const grantedAccess = await dataProtector.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: getRandomAddress(),
        authorizedUser: getRandomAddress(),
      });
      const res = await dataProtector.revokeOneAccess(grantedAccess);
      expect(res.access).toStrictEqual(grantedAccess);
      expect(res.txHash).toBeDefined();
    },
    2 * MAX_EXPECTED_BLOCKTIME
  );

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
