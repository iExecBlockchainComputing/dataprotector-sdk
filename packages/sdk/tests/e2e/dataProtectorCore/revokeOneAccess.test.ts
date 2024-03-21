import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtectorCore } from '../../../src/index.js';
import { ProtectedDataWithSecretProps } from '../../../src/lib/types/index.js';
import { ValidationError } from '../../../src/utils/errors.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomApp,
  getRandomAddress,
  getTestConfig,
} from '../../test-utils.js';

describe('dataProtectorCore.revokeOneAccess()', () => {
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;
  let protectedData: ProtectedDataWithSecretProps;
  let sconeAppAddress: string;
  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    const result = await Promise.all([
      dataProtectorCore.protectData({
        data: { doNotUse: 'test' },
      }),
      deployRandomApp({ teeFramework: 'scone' }),
    ]);
    protectedData = result[0];
    sconeAppAddress = result[1];
  }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'pass with a valid GrantedAccess',
    async () => {
      const grantedAccess = await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: sconeAppAddress,
        authorizedUser: getRandomAddress(),
      });
      const res = await dataProtectorCore.revokeOneAccess(grantedAccess);
      expect(res.access).toStrictEqual(grantedAccess);
      expect(res.txHash).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );

  it(
    'checks arg 0 is a required GrantedAccess',
    async () => {
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
      await expect(
        dataProtectorCore.revokeOneAccess(undefinedInput)
      ).rejects.toThrow(
        new ValidationError('The GrantedAccess is required to be revoked')
      );
      await expect(
        dataProtectorCore.revokeOneAccess({ ...grantedAccess, dataset: 'foo' })
      ).rejects.toThrow(
        new ValidationError('dataset should be an ethereum address')
      );
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
