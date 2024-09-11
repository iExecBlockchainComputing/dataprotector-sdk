import { Wallet, JsonRpcProvider, ethers } from 'ethers';
import { IExecAppModule, IExecConfig, TeeFramework, utils } from 'iexec';
import {
  DataProtectorConfigOptions,
  Web3SignerProvider,
  getWeb3Provider,
} from '../src/index.js';
import { WAIT_FOR_SUBGRAPH_INDEXING } from './unit/utils/waitForSubgraphIndexing.js';

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
  count: 2,
};
export const EMPTY_ORDER_BOOK: any = {
  orders: [],
  count: 0,
};

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
