// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Wallet, JsonRpcProvider, ethers, Contract, isAddress } from 'ethers';
import { IExec, IExecAppModule, IExecConfig, TeeFramework, utils } from 'iexec';
import { getSignerFromPrivateKey } from 'iexec/utils';
import {
  AddressOrENS,
  DataProtectorConfigOptions,
  Web3SignerProvider,
  getWeb3Provider,
} from '../src/index.js';
// eslint-disable-next-line import/extensions
import { getEventFromLogs } from '../src/utils/transactionEvent.js';
import { VOUCHER_HUB_ADDRESS } from './bellecour-fork/voucher-config.js';
import { WAIT_FOR_SUBGRAPH_INDEXING } from './unit/utils/waitForSubgraphIndexing.js';

const { DRONE } = process.env;

export const TEST_CHAIN = {
  rpcURL: DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545',
  chainId: '134',
  smsURL: DRONE ? 'http://sms:13300' : 'http://127.0.0.1:13300',
  resultProxyURL: DRONE
    ? 'http://result-proxy:13200'
    : 'http://127.0.0.1:13200',
  iexecGatewayURL: DRONE ? 'http://market-api:3000' : 'http://127.0.0.1:3000',
  voucherHubAddress: VOUCHER_HUB_ADDRESS, // TODO: change with deployment address once voucher is deployed on bellecour
  voucherManagerWallet: new Wallet(
    '0x2c906d4022cace2b3ee6c8b596564c26c4dcadddf1e949b769bcb0ad75c40c33'
  ),
  voucherSubgraphURL: DRONE
    ? 'http://graphnode:8000/subgraphs/name/bellecour/iexec-voucher'
    : 'http://localhost:8000/subgraphs/name/bellecour/iexec-voucher',
  debugWorkerpool: 'debug-v8-bellecour.main.pools.iexec.eth',
  debugWorkerpoolOwnerWallet: new Wallet(
    '0x800e01919eadf36f110f733decb1cc0f82e7941a748e89d7a3f76157f6654bb3'
  ),
  prodWorkerpool: 'prod-v8-bellecour.main.pools.iexec.eth',
  prodWorkerpoolOwnerWallet: new Wallet(
    '0x6a12f56d7686e85ab0f46eb3c19cb0c75bfabf8fb04e595654fc93ad652fa7bc'
  ),
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
  voucherHubAddress: TEST_CHAIN.voucherHubAddress,
  voucherSubgraphURL: TEST_CHAIN.voucherSubgraphURL,
});

export const getTestConfig = (
  privateKey: string
): [Web3SignerProvider, DataProtectorConfigOptions] => {
  const ethProvider = getTestWeb3SignerProvider(privateKey);
  const options = {
    iexecOptions: getTestIExecOption(),
    ipfsGateway: DRONE ? 'http://ipfs:8080' : 'http://127.0.0.1:8080',
    ipfsNode: DRONE ? 'http://ipfs:5001' : 'http://127.0.0.1:5001',
    subgraphUrl: DRONE
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
const MARKET_API_CALL_TIMEOUT = 2_000;
const SMART_CONTRACT_CALL_TIMEOUT = 10_000;

const ONE_SMART_CONTRACT_WRITE_CALL =
  SUBGRAPH_CALL_TIMEOUT +
  SMART_CONTRACT_CALL_TIMEOUT +
  WAIT_FOR_SUBGRAPH_INDEXING;

const SHOW_USER_VOUCHER = SUBGRAPH_CALL_TIMEOUT + MAX_EXPECTED_BLOCKTIME * 2;

export const timeouts = {
  // DataProtector
  protectData: SMART_CONTRACT_CALL_TIMEOUT + MAX_EXPECTED_WEB2_SERVICES_TIME, // IPFS + SC + SMS
  getProtectedData: SUBGRAPH_CALL_TIMEOUT,

  // fetchDatasetOrderbook + fetchAppOrderbook + fetchWorkerpoolOrderbook + pushRequesterSecret + createRequestorder + signRequestorder + matchOrders
  processProtectedData:
    6 * MARKET_API_CALL_TIMEOUT + 2 * SMART_CONTRACT_CALL_TIMEOUT,

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
    // appForProtectedData + ownerOf + consumeProtectedData + fetchWorkerpoolOrderbook + showUserVoucher +isAuthorizedToUseVoucher + isAssetEligibleToMatchOrdersSponsoring + checkAllowance + (20sec?)
    SUBGRAPH_CALL_TIMEOUT +
    3 * SMART_CONTRACT_CALL_TIMEOUT +
    SHOW_USER_VOUCHER +
    2 * SMART_CONTRACT_CALL_TIMEOUT +
    2 * SMART_CONTRACT_CALL_TIMEOUT +
    2 * SMART_CONTRACT_CALL_TIMEOUT +
    20_000,
  tx: 2 * MAX_EXPECTED_BLOCKTIME,

  // utils
  createAndPublishWorkerpoolOrder: 3 * MAX_EXPECTED_MARKET_API_PURGE_TIME,
  createVoucherType: MAX_EXPECTED_BLOCKTIME * 2,
  createVoucher: MAX_EXPECTED_BLOCKTIME * 4 + MARKET_API_CALL_TIMEOUT * 2,
  addEligibleAsset: MAX_EXPECTED_BLOCKTIME * 2 * 3, // 3 maximum attempts in case of error
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

export const sleep = (ms) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });

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
  const weiAmount = BigInt(`${nRlcTargetBalance}`) * 10n ** 9n; // 1 nRLC is 10^9 wei
  await setBalance(address, weiAmount);
};

export const createVoucherType = async ({
  description = 'test',
  duration = 1000,
} = {}) => {
  const VOUCHER_HUB_ABI = [
    {
      inputs: [
        {
          internalType: 'string',
          name: 'description',
          type: 'string',
        },
        {
          internalType: 'uint256',
          name: 'duration',
          type: 'uint256',
        },
      ],
      name: 'createVoucherType',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'uint256',
          name: 'id',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'string',
          name: 'description',
          type: 'string',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'duration',
          type: 'uint256',
        },
      ],
      name: 'VoucherTypeCreated',
      type: 'event',
    },
  ];
  const voucherHubContract = new Contract(
    TEST_CHAIN.voucherHubAddress,
    VOUCHER_HUB_ABI,
    TEST_CHAIN.provider
  );
  const signer = TEST_CHAIN.voucherManagerWallet.connect(TEST_CHAIN.provider);
  const createVoucherTypeTxHash = await voucherHubContract
    .connect(signer)
    .createVoucherType(description, duration);
  const txReceipt = await createVoucherTypeTxHash.wait();
  const { id } = getEventFromLogs('VoucherTypeCreated', txReceipt.logs, {
    strict: true,
  }).args;

  return id as bigint;
};

// TODO: update createWorkerpoolorder() parameters when it is specified
export const createAndPublishWorkerpoolOrder = async (
  workerpool: AddressOrENS,
  workerpoolOwnerWallet: ethers.Wallet,
  workerpoolprice? = 1000,
  owner?: AddressOrENS
) => {
  const ethProvider = utils.getSignerFromPrivateKey(
    TEST_CHAIN.rpcURL,
    workerpoolOwnerWallet.privateKey
  );
  const iexec = new IExec({ ethProvider }, getTestIExecOption());

  const volume = 1000;

  await setNRlcBalance(
    await iexec.wallet.getAddress(),
    volume * workerpoolprice
  );
  await iexec.account.deposit(volume * workerpoolprice);
  let workerpoolAddress = workerpool;
  if (!isAddress(workerpool)) {
    workerpoolAddress = await iexec.ens.resolveName(workerpool);
  }
  const workerpoolorder = await iexec.order.createWorkerpoolorder({
    workerpool: workerpoolAddress,
    category: 0,
    requesterrestrict: owner,
    volume,
    workerpoolprice,
    tag: ['tee', 'scone'],
  });

  await iexec.order
    .signWorkerpoolorder(workerpoolorder)
    .then((o) => iexec.order.publishWorkerpoolorder(o));
};

export const createAndPublishAppOrders = async (
  resourceProvider,
  appAddress,
  appPrice? = 0
) => {
  await resourceProvider.order
    .createApporder({
      app: appAddress,
      tag: ['tee', 'scone'],
      volume: 100,
      appprice: appPrice,
    })
    .then(resourceProvider.order.signApporder)
    .then(resourceProvider.order.publishApporder);
};

export const createVoucher = async ({
  owner,
  voucherType,
  value,
}: {
  owner: string;
  voucherType: ethers.BigNumberish;
  value: ethers.BigNumberish;
}) => {
  const VOUCHER_HUB_ABI = [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'voucherType',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
      ],
      name: 'createVoucher',
      outputs: [
        {
          internalType: 'address',
          name: 'voucherAddress',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'getVoucher',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];

  const iexec = new IExec(
    {
      ethProvider: getSignerFromPrivateKey(
        TEST_CHAIN.rpcURL,
        TEST_CHAIN.voucherManagerWallet.privateKey
      ),
    },
    { hubAddress: TEST_CHAIN.hubAddress }
  );

  // ensure RLC balance
  await setNRlcBalance(await iexec.wallet.getAddress(), value);

  // deposit RLC to voucherHub
  const contractClient = await iexec.config.resolveContractsClient();
  const iexecContract = contractClient.getIExecContract();

  try {
    const tx = await iexecContract.depositFor(TEST_CHAIN.voucherHubAddress, {
      value: BigInt(value) * 10n ** 9n,
      gasPrice: 0,
    });
    await tx.wait();
  } catch (error) {
    console.error('Error depositing RLC:', error);
    throw error;
  }

  const voucherHubContract = new Contract(
    TEST_CHAIN.voucherHubAddress,
    VOUCHER_HUB_ABI,
    TEST_CHAIN.provider
  );

  const signer = TEST_CHAIN.voucherManagerWallet.connect(TEST_CHAIN.provider);

  try {
    const createVoucherTxHash = await voucherHubContract
      .connect(signer)
      .createVoucher(owner, voucherType, value);

    await createVoucherTxHash.wait();
  } catch (error) {
    console.error('Error creating voucher:', error);
    throw error;
  }

  try {
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.debugWorkerpool,
      TEST_CHAIN.debugWorkerpoolOwnerWallet,
      1000,
      owner
    );
    await createAndPublishWorkerpoolOrder(
      TEST_CHAIN.prodWorkerpool,
      TEST_CHAIN.prodWorkerpoolOwnerWallet,
      1000,
      owner
    );
  } catch (error) {
    console.error('Error publishing workerpoolorder:', error);
    throw error;
  }

  try {
    return await voucherHubContract.getVoucher(owner);
  } catch (error) {
    console.error('Error getting voucher:', error);
    throw error;
  }
};

export const addVoucherEligibleAsset = async (assetAddress, voucherTypeId) => {
  const voucherHubContract = new Contract(VOUCHER_HUB_ADDRESS, [
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'voucherTypeId',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'asset',
          type: 'address',
        },
      ],
      name: 'addEligibleAsset',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]);

  const signer = TEST_CHAIN.voucherManagerWallet.connect(TEST_CHAIN.provider);

  const retryableAddEligibleAsset = async (tryCount = 1) => {
    try {
      const tx = await voucherHubContract
        .connect(signer)
        .addEligibleAsset(voucherTypeId, assetAddress);
      await tx.wait();
    } catch (error) {
      console.warn(
        `Error adding eligible asset to voucher (try count ${tryCount}):`,
        error
      );
      if (tryCount < 3) {
        await sleep(3000 * tryCount);
        await retryableAddEligibleAsset(tryCount + 1);
      } else {
        throw new Error(
          `Failed to add eligible asset to voucher after ${tryCount} attempts`
        );
      }
    }
  };
  await retryableAddEligibleAsset();
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
