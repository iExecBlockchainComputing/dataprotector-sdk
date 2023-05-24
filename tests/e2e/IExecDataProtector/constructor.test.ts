import { describe, it, expect } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector } from '../../../dist/index';
import { getEthProvider } from '../../test-utils';

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
      getEthProvider(wallet.privateKey)
    );
    expect(dataProtector).toBeInstanceOf(IExecDataProtector);
  });
});
