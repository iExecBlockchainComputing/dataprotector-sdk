import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../dist/index';
import { ValidationError } from '../../../dist/utils/errors';
import { ProtectedDataWithSecretProps } from '../../../dist/dataProtector/types';
import { getEthProvider, getRequiredFieldMessage } from './test-utils';

describe('dataProtector.grantAccess()', () => {
  // same values used for the whole suite to save some execution time
  let dataProtector: IExecDataProtector;
  let wallet: Wallet;
  let protectedData: ProtectedDataWithSecretProps;

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
      authorizedApp: Wallet.createRandom().address,
      authorizedUser: Wallet.createRandom().address,
    };
  });

  it('pass with valid input', async () => {
    await expect(dataProtector.grantAccess(input)).resolves.toBeDefined();
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
});
