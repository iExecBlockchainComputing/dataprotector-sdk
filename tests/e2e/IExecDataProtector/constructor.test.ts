import { describe, it, expect, beforeEach } from '@jest/globals';
import { IExecDataProtector } from '../../../dist/index';
import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';

describe('IExecDataProtector()', () => {
  it('throw when instantiated with an invalid ethProvider', async () => {
    const invalidProvider = null;
    expect(() => new IExecDataProtector(invalidProvider)).toThrow(
      Error('Unsupported ethProvider')
    );
  });

  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const dataProtector = new IExecDataProtector(
      getSignerFromPrivateKey('bellecour', wallet.privateKey)
    );
    expect(dataProtector).toBeInstanceOf(IExecDataProtector);
  });
});
