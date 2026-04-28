import { describe, it, expect } from '@jest/globals';
import { Wallet } from 'ethers';
import { getWeb3Provider } from '../../src/index.js';

describe('getWeb3Provider()', () => {
  const { privateKey, address } = Wallet.createRandom();
  it('should use the wallet', async () => {
    const provider = getWeb3Provider(privateKey, 421614);
    const providerAddress = await provider.getAddress();
    expect(providerAddress).toBe(address);
  });

  it('should accept RPC URL as host', () => {
    expect(
      getWeb3Provider(privateKey, 'https://sepolia-rollup.arbitrum.io/rpc')
    ).toBeDefined();
  });

  it('should accept chainId as host', () => {
    expect(getWeb3Provider(privateKey, 421614)).toBeDefined();
  });

  it('should accept chain name as host', () => {
    expect(
      getWeb3Provider(privateKey, 'arbitrum-sepolia-testnet')
    ).toBeDefined();
  });

  describe.skip('When instantiating SDK with an experimental network', () => {
    describe('Without allowExperimentalNetworks', () => {
      it('should throw a configuration error', () => {
        expect(() =>
          getWeb3Provider(privateKey, 'arbitrum-sepolia-testnet')
        ).toThrow('Invalid provider host name or url');
      });
    });

    describe('With allowExperimentalNetworks: true', () => {
      it('should use the specified network', async () => {
        const provider = getWeb3Provider(
          privateKey,
          'arbitrum-sepolia-testnet',
          { allowExperimentalNetworks: true }
        );
        const network = await provider.provider.getNetwork();
        expect(network.name).toBe('arbitrum-sepolia');
      });
    });
  });
});
