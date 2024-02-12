import { ethers, type Contract } from 'ethers';
import { ABI as sharingABI } from '../../contracts/sharingAbi.js';
import { WorkflowError } from '../../utils/errors.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  AddressOrENS,
  IExecConsumer,
  RemoveProtectedDataAsRentableParams,
  RemoveProtectedDataAsRentableResponse,
} from '../types.js';

export const removeProtectedDataAsRentable = async ({
  iexec = throwIfMissing(),
  collectionTokenId = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
  sharingContractAddress,
}: IExecConsumer & {
  sharingContractAddress: AddressOrENS;
} & RemoveProtectedDataAsRentableParams): Promise<RemoveProtectedDataAsRentableResponse> => {
  //TODO:Input validation
  const { provider, signer } = await iexec.config.resolveContractsClient();

  const sharingContract = new ethers.Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  try {
    const tx = await (
      sharingContract.connect(signer) as Contract
    ).removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress);
    const txReceipt = await tx.wait();
    return {
      success: true,
      txHash: txReceipt.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set Subscription Options into sharing smart contract',
      e
    );
  }
};
