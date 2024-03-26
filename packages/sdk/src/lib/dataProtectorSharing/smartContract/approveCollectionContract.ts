import { ContractTransactionResponse, ethers } from 'ethers';
import { ErrorWithData } from '../../../utils/errors.js';
import { throwIfMissing } from '../../../utils/validators.js';
import type { Address } from '../../types/index.js';
import { IExecConsumer } from '../../types/internalTypes.js';
import { getPocoDatasetRegistryContract } from './getPocoRegistryContract.js';

export async function approveCollectionContract({
  iexec = throwIfMissing(),
  protectedDataAddress,
  sharingContractAddress,
}: IExecConsumer & {
  protectedDataAddress: Address;
  sharingContractAddress: Address;
}): Promise<ContractTransactionResponse> {
  const pocoProtectedDataRegistryContract =
    await getPocoDatasetRegistryContract(iexec);
  const protectedDataTokenId = ethers
    .getBigInt(protectedDataAddress)
    .toString();

  const approvedOperator = await pocoProtectedDataRegistryContract
    .getApproved(protectedDataTokenId)
    .catch(() => {
      throw new ErrorWithData(
        'This protected data does not seem to exist or it has been burned.',
        {
          protectedDataAddress,
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
