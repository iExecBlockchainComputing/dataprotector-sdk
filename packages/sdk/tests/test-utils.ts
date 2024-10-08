import { jest } from '@jest/globals';
import { Wallet, JsonRpcProvider, ethers } from 'ethers';
import { IExecAppModule, IExecConfig, TeeFramework, utils } from 'iexec';
import {
  type DataProtectorConfigOptions,
  type Web3SignerProvider,
} from '../src/index.js';
import { getWeb3Provider } from '../src/utils/getWeb3Provider.js';
import { WAIT_FOR_SUBGRAPH_INDEXING } from './utils/waitForSubgraphIndexing.js';

const { DRONE } = process.env;

const TEST_CHAIN = {
  rpcURL: DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545',
  chainId: '134',
  smsURL: DRONE ? 'http://sms:13300' : 'http://127.0.0.1:13300',
  resultProxyURL: DRONE
    ? 'http://result-proxy:13200'
    : 'http://127.0.0.1:13200',
  iexecGatewayURL: DRONE ? 'http://market-api:3000' : 'http://127.0.0.1:3000',
  provider: new JsonRpcProvider(
    DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545'
  ),
};

export const getTestWeb3SignerProvider = (
  privateKey: string = Wallet.createRandom().privateKey
): Web3SignerProvider =>
  utils.getSignerFromPrivateKey(TEST_CHAIN.rpcURL, privateKey);

export const getTestIExecOption = () => ({
  smsURL: TEST_CHAIN.smsURL,
  resultProxyURL: TEST_CHAIN.resultProxyURL,
  iexecGatewayURL: TEST_CHAIN.iexecGatewayURL,
});

export const getTestConfig = (
  privateKey: string
): [Web3SignerProvider, DataProtectorConfigOptions] => {
  const ethProvider = getTestWeb3SignerProvider(privateKey);
  const options = {
    iexecOptions: getTestIExecOption(),
    ipfsGateway: process.env.DRONE
      ? 'http://ipfs:8080'
      : 'http://127.0.0.1:8080',
    ipfsNode: process.env.DRONE ? 'http://ipfs:5001' : 'http://127.0.0.1:5001',
    subgraphUrl: process.env.DRONE
      ? 'http://graphnode:8000/subgraphs/name/DataProtector-v2'
      : 'http://127.0.0.1:8000/subgraphs/name/DataProtector-v2',
  };
  return [ethProvider, options];
};

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const getRandomTxHash = () => {
  const characters = '0123456789abcdef';
  let hash = '0x';

  for (let i = 0; i < 64; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    hash += characters[randomIndex];
  }

  return hash;
};

export const deployRandomApp = async (
  options: {
    ethProvider?: Web3SignerProvider;
    teeFramework?: TeeFramework;
  } = {}
) => {
  const ethProvider =
    options.ethProvider || getWeb3Provider(Wallet.createRandom().privateKey);
  const iexecAppModule = new IExecAppModule({ ethProvider });
  const { address } = await iexecAppModule.deployApp({
    owner: ethProvider.address,
    name: 'test-do-not-use',
    type: 'DOCKER',
    multiaddr: 'foo/bar:baz',
    checksum:
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    mrenclave:
      options.teeFramework &&
      ({
        // base
        framework: options.teeFramework,
        version: 'v0',
        fingerprint: 'thumb',
        // scone specific
        entrypoint: options.teeFramework === 'scone' ? 'foo' : undefined,
        heapSize: options.teeFramework === 'scone' ? 1 : undefined,
      } as any),
  });
  return address;
};

/**
 * on bellecour the blocktime is expected to be 5sec but in case of issue on the network this blocktime can reach unexpected length
 *
 * use this variable as a reference blocktime for tests timeout
 *
 * when the network is degraded, tweak the `MAX_EXPECTED_BLOCKTIME` value to reflect the network conditions
 */
export const MAX_EXPECTED_BLOCKTIME = 5_000;

export const MAX_EXPECTED_MARKET_API_PURGE_TIME = 5_000;

export const MAX_EXPECTED_WEB2_SERVICES_TIME = 80_000;

const SUBGRAPH_CALL_TIMEOUT = 2_000;
const SMART_CONTRACT_CALL_TIMEOUT = 10_000;

const ONE_SMART_CONTRACT_WRITE_CALL =
  SUBGRAPH_CALL_TIMEOUT +
  SMART_CONTRACT_CALL_TIMEOUT +
  WAIT_FOR_SUBGRAPH_INDEXING;

export const timeouts = {
  // DataProtector
  protectData: SMART_CONTRACT_CALL_TIMEOUT + MAX_EXPECTED_WEB2_SERVICES_TIME, // IPFS + SC + SMS
  getProtectedData: SUBGRAPH_CALL_TIMEOUT,

  // Collections
  createCollection: SMART_CONTRACT_CALL_TIMEOUT + WAIT_FOR_SUBGRAPH_INDEXING,
  addToCollection:
    SUBGRAPH_CALL_TIMEOUT + // checkAndGetProtectedData
    SMART_CONTRACT_CALL_TIMEOUT + // checkCollection
    3 * SMART_CONTRACT_CALL_TIMEOUT +
    WAIT_FOR_SUBGRAPH_INDEXING,

  // Subscription
  setSubscriptionParams: ONE_SMART_CONTRACT_WRITE_CALL,
  setProtectedDataToSubscription: ONE_SMART_CONTRACT_WRITE_CALL,
  subscribe: ONE_SMART_CONTRACT_WRITE_CALL,
  getCollectionSubscriptions: SUBGRAPH_CALL_TIMEOUT,
  removeProtectedDataFromSubscription:
    SUBGRAPH_CALL_TIMEOUT +
    SMART_CONTRACT_CALL_TIMEOUT +
    WAIT_FOR_SUBGRAPH_INDEXING,

  // Renting
  setProtectedDataToRenting: ONE_SMART_CONTRACT_WRITE_CALL,
  removeProtectedDataFromRenting:
    SUBGRAPH_CALL_TIMEOUT + SMART_CONTRACT_CALL_TIMEOUT,
  rentProtectedData: ONE_SMART_CONTRACT_WRITE_CALL,

  // Selling
  setProtectedDataForSale: ONE_SMART_CONTRACT_WRITE_CALL,
  removeProtectedDataForSale: ONE_SMART_CONTRACT_WRITE_CALL,
  buyProtectedData: 2 * SUBGRAPH_CALL_TIMEOUT + SMART_CONTRACT_CALL_TIMEOUT,

  // AppWhitelist
  createAppInPocoRegistry: ONE_SMART_CONTRACT_WRITE_CALL,
  createAddOnlyAppWhitelist: ONE_SMART_CONTRACT_WRITE_CALL,
  addAppToAddOnlyAppWhitelist: 2 * ONE_SMART_CONTRACT_WRITE_CALL,
  getUserAddOnlyAppWhitelist: SUBGRAPH_CALL_TIMEOUT,

  // Other
  getProtectedDataById: SUBGRAPH_CALL_TIMEOUT,
  getProtectedDataPricingParams: SUBGRAPH_CALL_TIMEOUT,
  consumeProtectedData:
    // appForProtectedData + ownerOf + consumeProtectedData + fetchWorkerpoolOrderbook (20sec?)
    SUBGRAPH_CALL_TIMEOUT + 3 * SMART_CONTRACT_CALL_TIMEOUT + 20_000,

  tx: 2 * MAX_EXPECTED_BLOCKTIME,
};

export const EMPTY_ORDER_BOOK: any = {
  orders: [],
  count: 0,
};

export function resolveWithNoOrder() {
  return jest
    .fn<() => Promise<{ orders: []; count: 0 }>>()
    .mockResolvedValue(EMPTY_ORDER_BOOK);
}

export function observableMockComplete() {
  const mockObservable: any = {
    subscribe: jest.fn(({ complete }) => {
      // Call complete immediately to resolve the promise
      complete();
    }),
  };
  return jest.fn<() => Promise<any>>().mockResolvedValue(mockObservable);
}

export const setBalance = async (
  address: string,
  targetWeiBalance: ethers.BigNumberish
) => {
  await fetch(TEST_CHAIN.rpcURL, {
    method: 'POST',
    body: JSON.stringify({
      method: 'anvil_setBalance',
      params: [address, ethers.toBeHex(targetWeiBalance)],
      id: 1,
      jsonrpc: '2.0',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const setNRlcBalance = async (
  address: string,
  nRlcTargetBalance: ethers.BigNumberish
) => {
  const weiAmount = BigInt(`${nRlcTargetBalance}`) * BigInt(1_000_000_000); // 1 nRLC is 10^9 wei
  await setBalance(address, weiAmount);
};

export const depositNRlcForAccount = async (
  address: string,
  nRlcAmount: ethers.BigNumberish
) => {
  const sponsorWallet = Wallet.createRandom();
  await setNRlcBalance(sponsorWallet.address, nRlcAmount);
  const ethProvider = getTestConfig(sponsorWallet.privateKey)[0];
  const iexecConfig = new IExecConfig({ ethProvider });
  const { getIExecContract } = await iexecConfig.resolveContractsClient();
  const iexecContract = getIExecContract();
  const tx = await iexecContract.depositFor(address, {
    value: BigInt(nRlcAmount) * BigInt(1_000_000_000), // 1 nRLC is 10^9 wei
    gasPrice: 0,
  });
  await tx.wait();
};

export const approveAccount = async (
  privateKey: string,
  approvedAddress: string,
  nRlcAmount: ethers.BigNumberish
) => {
  const ethProvider = getTestConfig(privateKey)[0];
  const iexecConfig = new IExecConfig({ ethProvider });
  const { getIExecContract } = await iexecConfig.resolveContractsClient();
  const iexecContract = getIExecContract();
  const tx = await iexecContract.approve(approvedAddress, nRlcAmount, {
    gasPrice: 0,
  });
  await tx.wait();
};
