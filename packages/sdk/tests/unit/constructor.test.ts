/* eslint-disable @typescript-eslint/dot-notation */
// needed to access and assert IExecDataProtector's private properties
import { describe, it, expect } from '@jest/globals';
import { Wallet } from 'ethers';
import { CHAIN_CONFIG } from '../../src/config/config.js';
import { IExecDataProtector, getWeb3Provider } from '../../src/index.js';

describe('IExecDataProtector()', () => {
  it('should use default ipfs node url when ipfsNode is NOT provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    await dataProtector['init']();
    const ipfsNode = dataProtector['ipfsNode'];
    expect(ipfsNode).toStrictEqual(CHAIN_CONFIG['134'].ipfsNode);
  });

  it('should use provided ipfs node url when ipfsNode is provided', async () => {
    const customIpfsNode = 'https://example.com/node';
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        ipfsNode: customIpfsNode,
      }
    );
    await dataProtector['init']();
    const ipfsNode = dataProtector['ipfsNode'];
    expect(ipfsNode).toStrictEqual(customIpfsNode);
  });

  it('should use default ipfs gateway url when ipfsGateway is NOT provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    await dataProtector['init']();
    const ipfsGateway = dataProtector['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(CHAIN_CONFIG['134'].ipfsGateway);
  });

  it('should use default ipfs gateway url when ipfsGateway is provided', async () => {
    const customIpfsGateway = 'https://example.com/ipfs_gateway';
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        ipfsGateway: customIpfsGateway,
      }
    );
    await dataProtector['init']();
    const ipfsGateway = dataProtector['ipfsGateway'];
    expect(ipfsGateway).toStrictEqual(customIpfsGateway);
  });

  it('should use default smart contract address when dataprotectorContractAddress is NOT provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    await dataProtector['init']();
    const dataprotectorContractAddress =
      dataProtector['dataprotectorContractAddress'];
    expect(dataprotectorContractAddress).toStrictEqual(
      CHAIN_CONFIG['134'].dataprotectorContractAddress
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
    await dataProtector['init']();
    const dataprotectorContractAddress =
      dataProtector['dataprotectorContractAddress'];
    expect(dataprotectorContractAddress).toStrictEqual(
      customSContractAddress.toLowerCase()
    );
  });

  it('should use default subgraph URL when subgraphUrl is NOT provided', async () => {
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey)
    );
    await dataProtector['init']();
    const graphQLClientUrl = dataProtector['graphQLClient'];
    expect(graphQLClientUrl['url']).toBe(CHAIN_CONFIG['134'].subgraphUrl);
  });

  it('should use provided subgraph URL when subgraphUrl is provided', async () => {
    const customSubgraphUrl = 'https://example.com/custom-subgraph';
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(Wallet.createRandom().privateKey),
      {
        subgraphUrl: customSubgraphUrl,
      }
    );
    await dataProtector['init']();
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
    await dataProtector['init']();

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

  it('throws when calling init() with an invalid ethProvider', async () => {
    const invalidProvider: any = {};
    const dataProtector = new IExecDataProtector(invalidProvider);
    await expect(dataProtector['init']()).rejects.toThrow(
      'Unsupported ethProvider: Invalid ethProvider: Unsupported provider'
    );
  });

  it('instantiates with a valid ethProvider', async () => {
    const wallet = Wallet.createRandom();
    const dataProtector = new IExecDataProtector(
      getWeb3Provider(wallet.privateKey)
    );
    await dataProtector['init']();
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
    await dataProtector['init']();
    const iexec = dataProtector['iexec'];
    expect(await iexec.config.resolveSmsURL()).toBe(smsURL);
  });

  describe('When instantiating SDK without a signer', () => {
    describe('When calling a write method', () => {
      it('should throw the corresponding exception', async () => {
        const dataProtector = new IExecDataProtector();
        await dataProtector['init']();
        await expect(
          dataProtector.core.protectData({
            data: { email: 'example@gmail.com' },
          })
        ).rejects.toThrow(
          'Unauthorized method. Please log in with your wallet, you must set a valid provider with a signer.'
        );
      });
    });
  });
});
