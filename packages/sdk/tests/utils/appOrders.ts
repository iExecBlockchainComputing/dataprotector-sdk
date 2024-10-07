import { jest } from '@jest/globals';
import { getRandomAddress, getRandomTxHash } from '../test-utils.js';

export function getAppOrderObject({ withApp }: { withApp?: string } = {}) {
  return {
    app: withApp ?? getRandomAddress(),
    appprice: 0,
    volume: 12,
    tag: '0xAnotherAppTag456',
    datasetrestrict: '0xAnotherDatasetRestrictAddress456',
    workerpoolrestrict: '0xAnotherWorkerpoolRestrictAddress456',
    requesterrestrict: '0xAnotherRequesterRestrictAddress456',
    salt: '0xAnotherSalt456',
    sign: '0xAnotherSign456',
  };
}

export function getOneAppOrder({ withApp }: { withApp?: string } = {}) {
  return {
    order: getAppOrderObject({ withApp }),
    orderHash: getRandomTxHash(),
    chainId: 134,
    publicationTimestamp: '2023-06-15T16:39:22.713Z',
    signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
    status: 'open',
    remaining: 10,
  };
}

export function resolveWithOneAppOrder({ withApp }: { withApp?: string } = {}) {
  return jest.fn<any>().mockResolvedValue({
    count: 1,
    orders: [getOneAppOrder({ withApp })],
  });
}

export const MOCK_APP_ORDER = {
  orders: [
    {
      orderHash: '0xOrderHash456',
      chainId: 134,
      remaining: 8,
      status: 'completed',
      signer: '0xSignerAddress456',
      publicationTimestamp: '2023-10-15T14:00:00Z',
      order: {
        app: '0xAnotherAppAddress456',
        appprice: 0,
        volume: 12,
        tag: '0xAnotherAppTag456',
        datasetrestrict: '0xAnotherDatasetRestrictAddress456',
        workerpoolrestrict: '0xAnotherWorkerpoolRestrictAddress456',
        requesterrestrict: '0xAnotherRequesterRestrictAddress456',
        salt: '0xAnotherSalt456',
        sign: '0xAnotherSign456',
      },
    },
    {
      orderHash: '0xOrderHash456',
      chainId: 134,
      remaining: 8,
      status: 'completed',
      signer: '0xSignerAddress456',
      publicationTimestamp: '2023-10-15T14:00:00Z',
      order: {
        app: '0xAnotherAppAddress456',
        appprice: 10,
        volume: 12,
        tag: '0xAnotherAppTag456',
        datasetrestrict: '0xAnotherDatasetRestrictAddress456',
        workerpoolrestrict: '0xAnotherWorkerpoolRestrictAddress456',
        requesterrestrict: '0xAnotherRequesterRestrictAddress456',
        salt: '0xAnotherSalt456',
        sign: '0xAnotherSign456',
      },
    },
    {
      orderHash: '0xOrderHash123',
      chainId: 1,
      remaining: 5,
      status: 'open',
      signer: '0xSignerAddress123',
      publicationTimestamp: '2023-10-12T12:00:00Z',
      order: {
        app: '0xAppAddress123',
        appprice: 100,
        volume: 10,
        tag: '0xAppTag123',
        datasetrestrict: '0xDatasetRestrictAddress123',
        workerpoolrestrict: '0xWorkerpoolRestrictAddress123',
        requesterrestrict: '0xRequesterRestrictAddress123',
        salt: '0xSalt123',
        sign: '0xSign123',
      },
    },
    {
      orderHash: '0xOrderHash456',
      chainId: 134,
      remaining: 8,
      status: 'completed',
      signer: '0xSignerAddress456',
      publicationTimestamp: '2023-10-15T14:00:00Z',
      order: {
        app: '0xAnotherAppAddress456',
        appprice: 15,
        volume: 12,
        tag: '0xAnotherAppTag456',
        datasetrestrict: '0xAnotherDatasetRestrictAddress456',
        workerpoolrestrict: '0xAnotherWorkerpoolRestrictAddress456',
        requesterrestrict: '0xAnotherRequesterRestrictAddress456',
        salt: '0xAnotherSalt456',
        sign: '0xAnotherSign456',
      },
    },
  ],
  count: 4,
};
