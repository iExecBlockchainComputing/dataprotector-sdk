/* eslint-disable @typescript-eslint/dot-notation */
// needed to access and assert IExecDataProtector's private properties
import { describe, it, expect } from '@jest/globals';
import { Wallet } from 'ethers';
import {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_IEXEC_IPFS_NODE,
  DEFAULT_IPFS_GATEWAY,
  DEFAULT_SUBGRAPH_URL,
} from '../../src/config/config.js';
import { IExecDataProtector, getWeb3Provider } from '../../src/index.js';

describe('IExecDataProtector()', () => {
  it('should use default ipfs node url when ipfsNode is not provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    const ipfsNode = dataProtector['ipfsNode'];
    expect(ipfsNode).toStrictEqual(DEFAULT_IEXEC_IPFS_NODE);
  });
  it('should use provided ipfs node url when ipfsNode is provided', async () => {
    const customIpfsNode = 'https://example.com/node';
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        ipfsNode: customIpfsNode,
      }
    );
    const ipfsNode = dataProtector['ipfsNode'];
    expect(ipfsNode).toStrictEqual(customIpfsNode);
  });
  it('should use default ipfs gateway url when ipfsGateway is not provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    const ipfsGateway = dataProtector['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(DEFAULT_IPFS_GATEWAY);
  });
  it('should use default ipfs gateway url when ipfsGateway is provided', async () => {
    const customIpfsGateway = 'https://example.com/ipfs_gateway';
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        ipfsGateway: customIpfsGateway,
      }
    );
    const ipfsGateway = dataProtector['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
  });
  it('should use default smart contract address when dataprotectorContractAddress is not provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    const dataprotectorContractAddress =
      dataProtector['dataprotectorContractAddress'];
    expect(dataprotectorContractAddress).toStrictEqual(
      DEFAULT_CONTRACT_ADDRESS
    );
  });
  it('should use provided smart contract address when dataprotectorContractAddress is provided', async () => {
    const customSContractAddress = Wallet.createRandom().address;
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        dataprotectorContractAddress: customSContractAddress,
      }
    );
    const dataprotectorContractAddress =
      dataProtector['dataprotectorContractAddress'];
    expect(dataprotectorContractAddress).toStrictEqual(
      customSContractAddress.toLowerCase()
    );
  });
  it('should use default subgraph URL when subgraphUrl is not provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    const graphQLClientUrl = dataProtector['graphQLClient'];
    expect(graphQLClientUrl['url']).toBe(DEFAULT_SUBGRAPH_URL);
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
    expect(graphQLClient['url']).toBe(customSubgraphUrl);
  });
  it('should use provided options', async () => {
    const customSubgraphUrl = 'https://example.com/custom-subgraph';
    const customIpfsGateway = 'https://example.com/ipfs_gateway';
    const customSContractAddress = Wallet.createRandom().address;
    const customIpfsNode = 'https://example.com/node';
    const smsURL = 'https://custom-sms-url.com';
    const iexecGatewayURL = 'https://custom-market-api-url.com';
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        subgraphUrl: customSubgraphUrl,
        dataprotectorContractAddress: customSContractAddress,
        ipfsGateway: customIpfsGateway,
        ipfsNode: customIpfsNode,
        iexecOptions: {
          smsURL,
          iexecGatewayURL,
        },
      }
    );
    const graphQLClient = dataProtector['graphQLClient'];
    const ipfsNode = dataProtector['ipfsNode'];
    const ipfsGateway = dataProtector['ipfsGateway'];
    const dataprotectorContractAddress =
      dataProtector['dataprotectorContractAddress'];
    const iexec = dataProtector['iexec'];

    expect(graphQLClient['url']).toBe(customSubgraphUrl);
    expect(ipfsNode).toStrictEqual(customIpfsNode);
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
    expect(dataprotectorContractAddress).toStrictEqual(
      customSContractAddress.toLowerCase()
    );
    expect(await iexec.config.resolveSmsURL()).toBe(smsURL);
    expect(await iexec.config.resolveIexecGatewayURL()).toBe(iexecGatewayURL);
  }, 20_000);
  it('throw when instantiated with an invalid ethProvider', async () => {
    const invalidProvider: any = null;
    expect(() => new IExecDataProtector(invalidProvider)).toThrow(
      Error('Unsupported ethProvider, Missing ethProvider')
    );
  });

  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(wallet.privateKey)
    );
    expect(dataProtector).toBeInstanceOf(IExecDataProtector);
  });

  it('instantiates with a valid ethProvider and iexecOptions', async () => {
    const smsURL = 'https://custom-sms-url.com';
    const wallet = Wallet.createRandom();
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(wallet.privateKey),
      {
        iexecOptions: {
          smsURL,
        },
      }
    );
    const iexec = dataProtector['iexec'];
    expect(await iexec.config.resolveSmsURL()).toBe(smsURL);
  });
});
