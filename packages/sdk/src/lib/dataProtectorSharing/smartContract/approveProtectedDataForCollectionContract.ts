import { ethers } from 'ethers';
import type { ContractTransactionResponse } from 'ethers';
import { ErrorWithData } from '../../../utils/errors.js';
import { throwIfMissing } from '../../../utils/validators.js';
import type { Address } from '../../types/index.js';
import type { IExecConsumer } from '../../types/internalTypes.js';
import { getPocoDatasetRegistryContract } from './getPocoRegistryContract.js';

export async function approveProtectedDataForCollectionContract({
  iexec = throwIfMissing(),
  protectedData,
  sharingContractAddress,
}: IExecConsumer & {
  protectedData: Address;
  sharingContractAddress: Address;
}): Promise<ContractTransactionResponse> {
  const pocoProtectedDataRegistryContract =
    await getPocoDatasetRegistryContract(iexec);
  const protectedDataTokenId = ethers.getBigInt(protectedData).toString();

  const approvedOperator = await pocoProtectedDataRegistryContract
    .getApproved(protectedDataTokenId)
    .catch(() => {
      throw new ErrorWithData(
        'This protected data does not seem to exist or it has been burned.',
        {
          protectedData,
        }
      );
    });

  if (approvedOperator.toLowerCase() !== sharingContractAddress) {
    const { txOptions } = await iexec.config.resolveContractsClient();
    const tx = await pocoProtectedDataRegistryContract.approve(
      sharingContractAddress,
      protectedDataTokenId,
      txOptions
    );
    await tx.wait();
    return tx;
  }
}
