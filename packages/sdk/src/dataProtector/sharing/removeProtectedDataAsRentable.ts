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
  await (sharingContract.connect(signer) as Contract)
    .removeProtectedDataFromRenting(collectionTokenId, protectedDataAddress)
    .then((tx) => tx.wait())
    .catch((e: Error) => {
      throw new WorkflowError(
        'Failed to set Subscription Options into sharing smart contract',
        e
      );
    });

  return {
    success: true,
  };
};
