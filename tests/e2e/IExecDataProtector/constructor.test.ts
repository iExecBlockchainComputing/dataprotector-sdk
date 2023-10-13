import { describe, it, expect } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../dist/index';
import {
  DATAPROTECTOR_DEFAULT_SUBGRAPH_URL,
  DEFAULT_CONTRACT_ADDRESS,
} from '../../../src/config/config';

describe('IExecDataProtector()', () => {
  it('should use default smart contract address when contractAddress', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    const contractAddress = dataProtector['contractAddress'];
    expect(contractAddress).toStrictEqual(DEFAULT_CONTRACT_ADDRESS);
  });
  it('should use provided smart contract address when contractAddress is provided', async () => {
    const customSContractAddress = Wallet.createRandom().address;
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        contractAddress: customSContractAddress,
      }
    );
    const contractAddress = dataProtector['contractAddress'];
    expect(contractAddress).toStrictEqual(customSContractAddress);
  });
  it('should use default subgraph URL when subgraphUrl is not provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    const graphQLClient = dataProtector['graphQLClient'];
    expect(graphQLClient.url).toBe(DATAPROTECTOR_DEFAULT_SUBGRAPH_URL);
  });
  it('should use provided subgraph URL when subgraphUrl is provided', async () => {
    const customSubgraphUrl = 'https://example.com/custom-subgraph';
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        subgraphUrl: customSubgraphUrl,
      }
    );
    const graphQLClient = dataProtector['graphQLClient'];
    expect(graphQLClient.url).toBe(customSubgraphUrl);
  });
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
