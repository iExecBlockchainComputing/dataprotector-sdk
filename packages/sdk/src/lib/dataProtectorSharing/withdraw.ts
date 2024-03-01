import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import type {
  IExecConsumer,
  SharingContractConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';

export const withdraw = async ({
  iexec = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
}: IExecConsumer &
  SharingContractConsumer): Promise<SuccessWithTransactionHash> => {
  const sharingContract = await getSharingContract(
    iexec,
    sharingContractAddress
  );
  // TODO: Check its account is not already empty

  try {
    const tx = await sharingContract.withdraw();
    await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to withdraw funds', e);
  }
};
