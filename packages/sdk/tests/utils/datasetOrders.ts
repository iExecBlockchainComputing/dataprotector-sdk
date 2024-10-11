import { jest } from '@jest/globals';
import { getRandomAddress } from '../test-utils.js';

export function getDatasetOrderObject({
  withDataset,
  withApp,
}: { withDataset?: string; withApp?: string } = {}) {
  return {
    dataset: withDataset ?? getRandomAddress(),
    datasetprice: 0,
    volume: 10,
    tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
    apprestrict: withApp ?? getRandomAddress(),
    workerpoolrestrict: '0x0000000000000000000000000000000000000000',
    requesterrestrict: '0x0000000000000000000000000000000000000000',
    salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
    sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
  };
}

export function getOneDatasetOrder({
  withDataset,
  withApp,
}: { withDataset?: string; withApp?: string } = {}) {
  return {
    order: getDatasetOrderObject({ withDataset, withApp }),
    orderHash:
      '0x396392835c2cbe933023dd28a3d6eedceb21c52b1dba199835a6f24cc75e7685',
    chainId: 134,
    publicationTimestamp: '2023-06-15T16:39:22.713Z',
    signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
    status: 'open',
    remaining: 10,
  };
}

export function resolveWithOneDatasetOrder({
  withDataset,
  withApp,
}: { withDataset?: string; withApp?: string } = {}) {
  return jest.fn<any>().mockResolvedValue({
    count: 1,
    orders: [getOneDatasetOrder({ withDataset, withApp })],
  });
}

export const MOCK_DATASET_ORDER = {
  orders: [
    {
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
    },
    {
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
    },
    {
      order: {
        dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
        datasetprice: 10,
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
    },
    {
      order: {
        dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
        datasetprice: 20,
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
    },
  ],
  count: 4,
};
