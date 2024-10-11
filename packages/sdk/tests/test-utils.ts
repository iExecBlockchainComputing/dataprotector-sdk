// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Wallet, JsonRpcProvider, ethers, Contract, isAddress } from 'ethers';
import { IExec, IExecAppModule, IExecConfig, TeeFramework, utils } from 'iexec';
import {
  AddressOrENS,
  DataProtectorConfigOptions,
  Web3SignerProvider,
  getWeb3Provider,
} from '../src/index.js';
// eslint-disable-next-line import/extensions
import { getEventFromLogs } from '../src/utils/getEventFromLogs.js';
import { VOUCHER_HUB_ADDRESS } from './bellecour-fork/voucher-config.js';
import { WAIT_FOR_SUBGRAPH_INDEXING } from './utils/waitForSubgraphIndexing.js';

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
    DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545',
    undefined,
    {
      pollingInterval: 1000, // speed up tests
    }
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

export const EMPTY_ORDER_BOOK: any = {
  orders: [],
  count: 0,
};

export const sleep = (ms) =>
  new Promise<void>((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });

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
  const weiAmount = BigInt(`${nRlcTargetBalance}`) * 10n ** 9n; // 1 nRLC is 10^9 wei
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
  const { id } = getEventFromLogs({
    contract: voucherHubContract,
    logs: txReceipt.logs,
    eventName: 'VoucherTypeCreated',
  }).args;

  return id as bigint;
};

// TODO: update createWorkerpoolorder() parameters when it is specified
export const createAndPublishWorkerpoolOrder = async (
  workerpool: AddressOrENS,
  workerpoolOwnerWallet: ethers.Wallet,
  workerpoolprice = 1000,
  owner?: AddressOrENS
) => {
  const ethProvider = utils.getSignerFromPrivateKey(
    TEST_CHAIN.rpcURL,
    workerpoolOwnerWallet.privateKey
  );
  const iexec = new IExec({ ethProvider }, getTestIExecOption());

  const volume = 1000;

  await depositNRlcForAccount(
    await iexec.wallet.getAddress(),
    volume * workerpoolprice
  );

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
  appPrice = 0
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

  // deposit RLC to voucherHub
  await depositNRlcForAccount(
    TEST_CHAIN.voucherHubAddress,
    BigInt(value) * 10n ** 9n
  );

  const voucherHubContract = new Contract(
    TEST_CHAIN.voucherHubAddress,
    VOUCHER_HUB_ABI,
    TEST_CHAIN.provider
  );

  const signer = TEST_CHAIN.voucherManagerWallet.connect(TEST_CHAIN.provider);

  const retryableCreateVoucher = async (tryCount = 1) => {
    try {
      const createVoucherTx = await voucherHubContract
        .connect(signer)
        .createVoucher(owner, voucherType, value);
      await createVoucherTx.wait();
    } catch (error) {
      console.warn(`Error creating voucher (try count ${tryCount}):`, error);
      if (tryCount < 3) {
        await sleep(3000 * tryCount);
        await retryableCreateVoucher(tryCount + 1);
      } else {
        throw new Error(`Failed to create voucher after ${tryCount} attempts`);
      }
    }
  };
  await retryableCreateVoucher();

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
