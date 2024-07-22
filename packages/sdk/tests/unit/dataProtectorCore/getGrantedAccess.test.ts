import { describe, expect, it, jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { IExec } from 'iexec';
import { getWeb3Provider } from '../../../src/index.js';
import { getGrantedAccess } from '../../../src/lib/dataProtectorCore/getGrantedAccess.js';

describe('getGrantedAccess', () => {
  const ethProvider = getWeb3Provider(Wallet.createRandom().privateKey);
  const MOCK_ORDER = {
    order: {
      dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
      datasetprice: 0,
      volume: 10,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
      apprestrict: '0x0000000000000000000000000000000000000000',
      workerpoolrestrict: '0x0000000000000000000000000000000000000000',
      requesterrestrict: '0x0000000000000000000000000000000000000000',
      salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
      sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
    },
    orderHash:
      '0x396392835c2cbe933023dd28a3d6eedceb21c52b1dba199835a6f24cc75e7685',
    chainId: 134,
    publicationTimestamp: '2023-06-15T16:39:22.713Z',
    signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
    status: 'open',
    remaining: 10,
  };
  const iexec: IExec = new IExec({
    ethProvider,
  });

  it('should fetch granted access without parameters (using default parameters) with the specified page and page size', async () => {
    const mockFetchDatasetOrderbook: any = jest
      .fn()
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          count: 1,
          orders: [MOCK_ORDER],
        });
      });
    iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
    const result = await getGrantedAccess({
      iexec: iexec,
      page: 1,
      pageSize: 10,
    });
    expect(result.count).toBe(1);
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      1,
      'any',
      {
        app: 'any',
        requester: 'any',
        page: 1,
        pageSize: 10,
        isRequesterStrict: false,
      }
    );
  });

  it('should fetch granted access with parameters with the specified page and page size', async () => {
    const mockFetchDatasetOrderbook: any = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        count: 1,
        page: 1,
        pageSize: 10,
        orders: [MOCK_ORDER],
      });
    });
    iexec.orderbook.fetchDatasetOrderbook = mockFetchDatasetOrderbook;
    const protectedData = Wallet.createRandom().address;
    const authorizedApp = Wallet.createRandom().address;
    const authorizedUser = Wallet.createRandom().address;
    const result = await getGrantedAccess({
      protectedData,
      authorizedApp,
      authorizedUser,
      iexec: iexec,
      page: 1,
      pageSize: 10,
    });
    expect(result.count).toBe(1);
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      1,
      protectedData.toLowerCase(),
      {
        app: authorizedApp.toLowerCase(),
        requester: authorizedUser.toLowerCase(),
        isRequesterStrict: false,
        page: 1,
        pageSize: 10,
      }
    );
    const result2 = await getGrantedAccess({
      protectedData,
      authorizedApp,
      authorizedUser,
      iexec: iexec,
      isUserStrict: true,
      page: 1,
      pageSize: 10,
    });
    expect(result2.count).toBe(1);
    expect(iexec.orderbook.fetchDatasetOrderbook).toHaveBeenNthCalledWith(
      2,
      protectedData.toLowerCase(),
      {
        app: authorizedApp.toLowerCase(),
        requester: authorizedUser.toLowerCase(),
        isRequesterStrict: true,
        page: 1,
        pageSize: 10,
      }
    );
  });
});
