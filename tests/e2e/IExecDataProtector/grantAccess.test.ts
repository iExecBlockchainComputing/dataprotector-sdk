import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Wallet } from 'ethers';
import { ProtectedDataWithSecretProps } from '../../../dist/dataProtector/types';
import { IExecDataProtector, getWeb3Provider } from '../../../dist/index';
import { ValidationError, WorkflowError } from '../../../dist/utils/errors';
import {
  deployRandomApp,
  getRandomAddress,
  getRequiredFieldMessage,
  MAX_EXPECTED_BLOCKTIME,
} from '../../test-utils';

describe('dataProtector.grantAccess()', () => {
  // same values used for the whole suite to save some execution time
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  let protectedData: ProtectedDataWithSecretProps;
  let nonTeeAppAddress: string;
  let sconeAppAddress: string;
  let gramineAppAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
    const results = await Promise.all([
      dataProtector.protectData({
        data: { doNotUse: 'test' },
      }),
      deployRandomApp(),
      deployRandomApp({ teeFramework: 'scone' }),
      deployRandomApp({ teeFramework: 'gramine' }),
    ]);
    protectedData = results[0];
    nonTeeAppAddress = results[1];
    sconeAppAddress = results[2];
    gramineAppAddress = results[3];
  }, 4 * MAX_EXPECTED_BLOCKTIME);

  let input: any;
  beforeEach(() => {
    input = {
      protectedData: protectedData.address,
      authorizedApp: getRandomAddress(),
      authorizedUser: getRandomAddress(),
    };
  });

  it('pass with valid input', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, authorizedApp: sconeAppAddress })
    ).resolves.toBeDefined();
  });
  it('infers the tag to use with a Scone app', async () => {
    const grantedAccess = await dataProtector.grantAccess({
      ...input,
      authorizedApp: sconeAppAddress,
    });
    expect(grantedAccess.tag).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000003'
    ); // ['tee', 'scone']
  });
  it('infers the tag to use with a Gramine app', async () => {
    const grantedAccess = await dataProtector.grantAccess({
      ...input,
      authorizedApp: gramineAppAddress,
    });
    expect(grantedAccess.tag).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000005'
    ); // ['tee', 'gramine']
  });
  it('checks protectedData is required address or ENS', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, protectedData: undefined })
    ).rejects.toThrow(
      new ValidationError(getRequiredFieldMessage('protectedData'))
    );
    await expect(
      dataProtector.grantAccess({ ...input, protectedData: 'foo' })
    ).rejects.toThrow(
      new ValidationError(
        'protectedData should be an ethereum address or a ENS name'
      )
    );
  });
  it('checks authorizedApp is required address or ENS', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, authorizedApp: undefined })
    ).rejects.toThrow(
      new ValidationError(getRequiredFieldMessage('authorizedApp'))
    );
    await expect(
      dataProtector.grantAccess({ ...input, authorizedApp: 'foo' })
    ).rejects.toThrow(
      new ValidationError(
        'authorizedApp should be an ethereum address or a ENS name'
      )
    );
  });
  it('checks authorizedUser is required address or ENS or "any"', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, authorizedUser: undefined })
    ).rejects.toThrow(
      new ValidationError(getRequiredFieldMessage('authorizedUser'))
    );
    await expect(
      dataProtector.grantAccess({ ...input, authorizedUser: 'foo' })
    ).rejects.toThrow(
      new ValidationError(
        'authorizedUser should be an ethereum address, a ENS name, or "any"'
      )
    );
  });
  it('checks pricePerAccess is a positive integer', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, pricePerAccess: -1 })
    ).rejects.toThrow(
      new ValidationError('pricePerAccess should be a positive integer')
    );
  });
  it('checks numberOfAccess is a strictly positive integer', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, numberOfAccess: -1 })
    ).rejects.toThrow(
      new ValidationError(
        'numberOfAccess should be a strictly positive integer'
      )
    );
  });
  it('fails if the app is not deployed', async () => {
    await expect(dataProtector.grantAccess({ ...input })).rejects.toThrow(
      new WorkflowError(
        'Failed to detect the app TEE framework',
        Error(`No app found for id ${input.authorizedApp} on chain 134`)
      )
    );
  });
  it('fails if the app is not a TEE app', async () => {
    await expect(
      dataProtector.grantAccess({ ...input, authorizedApp: nonTeeAppAddress })
    ).rejects.toThrow(
      new WorkflowError(
        'Failed to detect the app TEE framework',
        Error('App does not use a supported TEE framework')
      )
    );
  });
});
