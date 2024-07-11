import type { IExecPocoDelegate } from '../../../../generated/typechain/sharing/interfaces/IExecPocoDelegate.js';
import type { Address } from '../../types/index.js';
import type { AccountDetails } from '../../types/pocoTypes.js';

// ###############################################################################
// Batching is already implemented by default through the provider of ethers
// https://docs.ethers.org/v6/api/providers/jsonrpc/#JsonRpcApiProviderOptions.
// By default, this period is 10ms, meaning that batched requests will
// automatically combine requests within this timeframe for efficiency.
// The maximum size of the batched request is 1 Mb (bytes)
// ###############################################################################

const getAccountAllowance = async ({
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
  sharingContractAddress,
}: {
  pocoContract: IExecPocoDelegate;
  userAddress: Address;
  sharingContractAddress: Address;
}): Promise<AccountDetails> => {
  const [balance, sharingContractAllowance] = await Promise.all([
    getAccountBalance({ pocoContract, owner: userAddress }),
    getAccountAllowance({
      pocoContract,
      owner: userAddress,
      spender: sharingContractAddress,
    }),
  ]);
  return { balance, sharingContractAllowance };
};
