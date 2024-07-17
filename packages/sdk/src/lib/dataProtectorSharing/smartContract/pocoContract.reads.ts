import { Provider } from 'ethers';
import type { IExecPocoDelegate } from '../../../../generated/typechain/sharing/interfaces/IExecPocoDelegate.js';
import type { Address } from '../../types/index.js';
import type { AccountDetails } from '../../types/pocoTypes.js';

//###############################################################################
// Parallelized calls to batch requests in ethers JsonRpcApiProvider
// (https://docs.ethers.org/v6/api/providers/jsonrpc/#JsonRpcApiProviderOptions)
//###############################################################################

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

const getStackedAccountBalance = async ({
  pocoContract,
  owner,
}: {
  pocoContract: IExecPocoDelegate;
  owner: Address;
}) => {
  return pocoContract.balanceOf(owner);
};

const getAccountBalance = async ({
  userAddress,
  provider,
}: {
  userAddress: Address;
  provider: Provider;
}) => {
  return provider.getBalance(userAddress);
};

export const getAccountDetails = async ({
  provider,
  pocoContract,
  userAddress,
  sharingContractAddress,
}: {
  provider: Provider;
  pocoContract: IExecPocoDelegate;
  userAddress: Address;
  sharingContractAddress: Address;
}): Promise<AccountDetails> => {
  const [stackedBalance, balance, sharingContractAllowance] = await Promise.all(
    [
      getStackedAccountBalance({ pocoContract, owner: userAddress }),
      getAccountBalance({ userAddress, provider }),
      getAccountAllowance({
        pocoContract,
        owner: userAddress,
        spender: sharingContractAddress,
      }),
    ]
  );
  return {
    stackedBalance,
    balance,
    sharingContractAllowance,
  };
};
