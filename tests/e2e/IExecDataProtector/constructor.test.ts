import { describe, it, expect } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../dist/index';

describe('IExecDataProtector()', () => {
  it('throw when instantiated with an invalid ethProvider', async () => {
    const invalidProvider: any = null;
    expect(() => new IExecDataProtector(invalidProvider)).toThrow(
      Error('Unsupported ethProvider')
    );
  });

  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(wallet.privateKey)
    );
    expect(dataProtector).toBeInstanceOf(IExecDataProtector);
  });
});
