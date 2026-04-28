import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExecDataProtectorCore } from '../../../src/index.js';
import { ProtectedDataWithSecretProps } from '../../../src/lib/types/index.js';
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
  let teeAppAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    const config = await getTestConfig(wallet.privateKey);
    dataProtectorCore = new IExecDataProtectorCore(...config);
    const [appDeployerProvider] = await getTestConfig(
      Wallet.createRandom().privateKey
    );
    const result = await Promise.all([
      dataProtectorCore.protectData({
        data: { doNotUse: 'test' },
      }),
      deployRandomApp({
        ethProvider: appDeployerProvider,
      }),
    ]);
    protectedData = result[0];
    teeAppAddress = result[1];
  }, 4 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  it(
    'pass with a valid GrantedAccess',
    async () => {
      const grantedAccess = await dataProtectorCore.grantAccess({
        protectedData: protectedData.address,
        authorizedApp: teeAppAddress,
        authorizedUser: getRandomAddress(),
      });
      const res = await dataProtectorCore.revokeOneAccess(grantedAccess);
      expect(res.access).toStrictEqual(grantedAccess);
      expect(res.txHash).toBeDefined();
    },
    MAX_EXPECTED_WEB2_SERVICES_TIME
  );
});
