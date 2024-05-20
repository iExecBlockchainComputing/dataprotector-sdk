// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Wallet, JsonRpcProvider, ethers, Contract } from 'ethers';
import { IExec } from 'iexec';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { getEventFromLogs } from '../src/utils/transactionEvent.js';
import { VOUCHER_HUB_ADDRESS } from './bellecour-fork/voucher-config';
import { getTestConfig } from './test-config-utils.js';

export const sleep = (ms) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });

const { DRONE } = process.env;

export const TEST_CHAINS = {
  'bellecour-fork': {
    rpcURL: DRONE ? 'http://bellecour-fork:8545' : 'http://localhost:8545',
    chainId: '134',
    sconeSmsURL: DRONE ? 'http://sms:13300' : 'http://localhost:13300',
    gramineSmsURL: DRONE
      ? 'http://sms-gramine:13300'
      : 'http://localhost:13309',
    iexecGatewayURL: DRONE ? 'http://market-api:3000' : 'http://localhost:3000',
    resultProxyURL: DRONE
      ? 'http://result-proxy:13200'
      : 'http://localhost:13200',
    pocoAdminWallet: new Wallet(
      '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407'
    ),
    faucetWallet: new Wallet(
      '0xde43b282c2931fc41ca9e1486fedc2c45227a3b9b4115c89d37f6333c8816d89'
    ),
    voucherHubAddress: VOUCHER_HUB_ADDRESS, // TODO: change with deployment address once voucher is deployed on bellecour
    voucherManagerWallet: new Wallet(
      '0x2c906d4022cace2b3ee6c8b596564c26c4dcadddf1e949b769bcb0ad75c40c33'
    ),
    voucherSubgraphURL: DRONE
      ? 'http://gaphnode:8000/subgraphs/name/bellecour/iexec-voucher'
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
    defaults: {
      hubAddress: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
      ensRegistryAddress: '0x5f5B93fca68c9C79318d1F3868A354EE67D8c006',
      ensPublicResolverAddress: '0x1347d8a1840A810B990d0B774A6b7Bb8A1bd62BB',
      isNative: true,
      useGas: false,
      name: 'bellecour',
    },
    isAnvil: true,
  },
};

const faucetSendWeiToReachTargetBalance =
  (chain) =>
  async (address, targetWeiBalance, tryCount = 1) => {
    const currentBalance = await chain.provider.getBalance(address);
    const delta = BigInt(`${targetWeiBalance}`) - currentBalance;
    if (delta < 0n) {
      console.warn(
        `Faucet send Eth: aborted - current balance exceed target balance`
      );
      return;
    }
    try {
      const tx = await chain.faucetWallet
        .connect(chain.provider)
        .sendTransaction({ to: address, value: delta });
      await tx.wait();
    } catch (e) {
      console.warn(`Faucet send Eth: error (try count ${tryCount}) - ${e}`);
      // retry as concurrent calls can lead to nonce collisions on the faucet wallet
      if (tryCount < 3) {
        await sleep(3000 * tryCount);
        await faucetSendWeiToReachTargetBalance(chain)(
          address,
          targetWeiBalance,
          tryCount + 1
        );
      } else {
        throw Error(`Failed to send Eth from faucet (tried ${tryCount} times)`);
      }
    }
  };

export const setBalance = (chain) => async (address, targetWeiBalance) => {
  if (chain.isAnvil) {
    await fetch(chain.rpcURL, {
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
  } else {
    await faucetSendWeiToReachTargetBalance(chain)(address, targetWeiBalance);
  }
};

const faucetSendNRlcToReachTargetBalance =
  (chain) =>
  async (address, nRlcTargetBalance, tryCount = 1) => {
    const iexec = new IExec(
      {
        ethProvider: getSignerFromPrivateKey(
          chain.rpcURL,
          chain.faucetWallet.privateKey
        ),
      },
      { hubAddress: chain.hubAddress }
    );
    const { nRLC } = await iexec.wallet.checkBalances(address);
    const delta = BigInt(`${nRlcTargetBalance}`) - BigInt(`${nRLC}`);
    if (delta < 0n) {
      console.warn(
        `Faucet send RLC: aborted - current balance exceed target balance`
      );
      return;
    }
    try {
      await iexec.wallet.sendRLC(`${delta}`, address);
    } catch (e) {
      console.warn(`Faucet send RLC: error (try count ${tryCount}) - ${e}`);
      // retry as concurrent calls can lead to nonce collisions on the faucet wallet
      if (tryCount < 3) {
        await sleep(3000 * tryCount);
        await faucetSendNRlcToReachTargetBalance(chain)(
          address,
          nRlcTargetBalance,
          tryCount + 1
        );
      } else {
        throw Error(`Failed to send RLC from faucet (tried ${tryCount} times)`);
      }
    }
  };

export const setNRlcBalance = (chain) => async (address, nRlcTargetBalance) => {
  if (chain.isNative || chain.defaults?.isNative) {
    const weiAmount = BigInt(`${nRlcTargetBalance}`) * 10n ** 9n; // 1 nRLC is 10^9 wei
    await setBalance(chain)(address, weiAmount);
    return;
  }
  await faucetSendNRlcToReachTargetBalance(chain)(address, nRlcTargetBalance);
};

export const createVoucherType =
  (chain) =>
  async ({ description = 'test', duration = 1000 } = {}) => {
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
      chain.voucherHubAddress,
      VOUCHER_HUB_ABI,
      chain.provider
    );
    const signer = chain.voucherManagerWallet.connect(chain.provider);
    const createVoucherTypeTxHash = await voucherHubContract
      .connect(signer)
      .createVoucherType(description, duration);
    const txReceipt = await createVoucherTypeTxHash.wait();
    const { id } = getEventFromLogs('VoucherTypeCreated', txReceipt.logs, {
      strict: true,
    }).args;

    return id;
  };

// TODO: update createWorkerpoolorder() parameters when it is specified
const createAndPublishWorkerpoolOrder = async (
  chain,
  workerpool,
  workerpoolOwnerWallet,
  voucherOwnerAddress
) => {
  const { iexec } = getTestConfig(chain)({
    privateKey: workerpoolOwnerWallet.privateKey,
  });

  const workerpoolprice = 1000;
  const volume = 1000;

  await setNRlcBalance(chain)(
    await iexec.wallet.getAddress(),
    volume * workerpoolprice
  );
  await iexec.account.deposit(volume * workerpoolprice);

  const workerpoolorder = await iexec.order.createWorkerpoolorder({
    workerpool,
    category: 0,
    requesterrestrict: voucherOwnerAddress,
    volume,
    workerpoolprice,
    tag: ['tee', 'scone'],
  });

  await iexec.order
    .signWorkerpoolorder(workerpoolorder)
    .then((o) => iexec.order.publishWorkerpoolorder(o));
};

export const createVoucher =
  (chain) =>
  async ({ owner, voucherType, value }) => {
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
          chain.rpcURL,
          chain.voucherManagerWallet.privateKey
        ),
      },
      { hubAddress: chain.hubAddress }
    );

    // ensure RLC balance
    await setNRlcBalance(chain)(await iexec.wallet.getAddress(), value);

    // deposit RLC to voucherHub
    const contractClient = await iexec.config.resolveContractsClient();
    const iexecContract = await contractClient.getIExecContract();

    try {
      await iexecContract.depositFor(chain.voucherHubAddress, {
        value: BigInt(value) * 10n ** 9n,
        gasPrice: 0,
      });
    } catch (error) {
      console.error('Error depositing RLC:', error);
      throw error;
    }

    const voucherHubContract = new Contract(
      chain.voucherHubAddress,
      VOUCHER_HUB_ABI,
      chain.provider
    );

    const signer = chain.voucherManagerWallet.connect(chain.provider);

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
        chain,
        chain.debugWorkerpool,
        chain.debugWorkerpoolOwnerWallet,
        owner
      );
      await createAndPublishWorkerpoolOrder(
        chain,
        chain.prodWorkerpool,
        chain.prodWorkerpoolOwnerWallet,
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
