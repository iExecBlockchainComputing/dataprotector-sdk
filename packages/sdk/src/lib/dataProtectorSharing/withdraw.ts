import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import type {
  IExecConsumer,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { onlyBalanceNotEmpty } from './smartContract/preflightChecks.js';

export const withdraw = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer): Promise<SuccessWithTransactionHash> => {
  let userAddress = await iexec.wallet.getAddress();
  userAddress = userAddress.toLowerCase();

  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );

  //---------- Smart Contract Call ----------
  await onlyBalanceNotEmpty({ sharingContract, userAddress });

  try {
    const tx = await sharingContract.withdraw();
    await tx.wait();
    return {
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to withdraw funds', e);
  }
};
