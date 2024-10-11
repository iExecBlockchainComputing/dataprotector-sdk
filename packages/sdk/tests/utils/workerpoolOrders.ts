import { jest } from '@jest/globals';
import { Wallet } from 'ethers';
import { Address } from 'iexec';
import { getRandomAddress, getRandomTxHash } from '../test-utils.js';

export function getWorkerpoolOrderObject({
  withWorkerpool,
}: { withWorkerpool?: Address } = {}) {
  return {
    workerpool: withWorkerpool ?? getRandomAddress(),
    workerpoolprice: 0,
    volume: 5,
    tag: '0x11223344',
    category: 1,
    trust: 0.8,
    apprestrict: '0x0987654321',
    datasetrestrict: '0x13572468',
    requesterrestrict: '0x8765432109',
    salt: '0xaabbccddeeff',
    sign: '0xabcdef012345',
  };
}

export function getOneWorkerpoolOrder({
  withWorkerpool,
}: { withWorkerpool?: Address } = {}) {
  return {
    order: getWorkerpoolOrderObject({ withWorkerpool }),
    orderHash: getRandomTxHash(),
    chainId: 134,
    publicationTimestamp: '2023-06-15T16:39:22.713Z',
    signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
    status: 'open',
    remaining: 10,
  };
}

export function resolveWithOneWorkerpoolOrder({
  withWorkerpool,
}: { withWorkerpool?: Address } = {}) {
  return jest.fn<any>().mockResolvedValue({
    count: 1,
    orders: [getOneWorkerpoolOrder({ withWorkerpool })],
  });
}

export const MOCK_WORKERPOOL_ORDER = {
  orders: [
    {
      orderHash: '0xabcdef123456',
      chainId: 1,
      remaining: 10,
      status: 'published',
      signer: '0x1234567890',
      publicationTimestamp: '2023-10-12T10:00:00Z',
      order: {
        workerpool: Wallet.createRandom().address,
        workerpoolprice: 0,
        volume: 5,
        tag: '0x11223344',
        category: 1,
        trust: 0.8,
        apprestrict: '0x0987654321',
        datasetrestrict: '0x13572468',
        requesterrestrict: '0x8765432109',
        salt: '0xaabbccddeeff',
        sign: '0xabcdef012345',
      },
    },
    {
      orderHash: '0xabcdef123456',
      chainId: 1,
      remaining: 10,
      status: 'published',
      signer: '0x1234567890',
      publicationTimestamp: '2023-10-12T10:00:00Z',
      order: {
        workerpool: Wallet.createRandom().address,
        workerpoolprice: 8,
        volume: 5,
        tag: '0x11223344',
        category: 1,
        trust: 0.8,
        apprestrict: '0x0987654321',
        datasetrestrict: '0x13572468',
        requesterrestrict: '0x8765432109',
        salt: '0xaabbccddeeff',
        sign: '0xabcdef012345',
      },
    },
    {
      orderHash: '0xabcdef123456',
      chainId: 1,
      remaining: 10,
      status: 'published',
      signer: '0x1234567890',
      publicationTimestamp: '2023-10-12T10:00:00Z',
      order: {
        workerpool: Wallet.createRandom().address,
        workerpoolprice: 0,
        volume: 5,
        tag: '0x11223344',
        category: 1,
        trust: 0.8,
        apprestrict: '0x0987654321',
        datasetrestrict: '0x13572468',
        requesterrestrict: '0x8765432109',
        salt: '0xaabbccddeeff',
        sign: '0xabcdef012345',
      },
    },
    {
      orderHash: '0xabcdef123456',
      chainId: 1,
      remaining: 10,
      status: 'published',
      signer: '0x1234567890',
      publicationTimestamp: '2023-10-12T10:00:00Z',
      order: {
        workerpool: Wallet.createRandom().address,
        workerpoolprice: 18,
        volume: 5,
        tag: '0x11223344',
        category: 1,
        trust: 0.8,
        apprestrict: '0x0987654321',
        datasetrestrict: '0x13572468',
        requesterrestrict: '0x8765432109',
        salt: '0xaabbccddeeff',
        sign: '0xabcdef012345',
      },
    },
  ],
  count: 4,
};
