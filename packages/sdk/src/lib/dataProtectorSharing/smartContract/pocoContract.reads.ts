import type { IExecPocoDelegate } from '../../../../generated/typechain/sharing/interfaces/IExecPocoDelegate.js';
import type { Address } from '../../types/index.js';
import type { AccountDetails } from '../../types/pocoTypes.js';

//###############################################################################
// Parallelized calls to batch requests in ethers JsonRpcApiProvider
// (https://docs.ethers.org/v6/api/providers/jsonrpc/#JsonRpcApiProviderOptions)
//###############################################################################

export const getAccountAllowance = async ({
  pocoContract,
  owner,
  spender,
}: {
  pocoContract: IExecPocoDelegate;
  owner: Address;
  spender: Address;
}) => {
  return pocoContract.allowance(owner, spender);
};

const getAccountBalance = async ({
  pocoContract,
  owner,
}: {
  pocoContract: IExecPocoDelegate;
  owner: Address;
}) => {
  return pocoContract.balanceOf(owner);
};

export const getAccountDetails = async ({
  pocoContract,
  userAddress,
  spender,
}: {
  pocoContract: IExecPocoDelegate;
  userAddress: Address;
  spender: Address;
}): Promise<AccountDetails> => {
  const [balance, spenderAllowance] = await Promise.all([
    getAccountBalance({ pocoContract, owner: userAddress }),
    getAccountAllowance({
      pocoContract,
      owner: userAddress,
      spender: spender,
    }),
  ]);
  return { balance, spenderAllowance };
};
