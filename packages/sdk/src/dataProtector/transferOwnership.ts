import { WorkflowError } from '../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  addressOrEnsSchema,
  throwIfMissing,
} from '../utils/validators.js';
import { Address, AddressOrENS, IExecConsumer } from './types/shared.js';

export type TransferOwnershipParams = {
  protectedData: Address;
  newOwner: AddressOrENS;
};

export type TransferOwnershipResponse = {
  address: Address;
  to: AddressOrENS;
  txHash: string;
};

export const transferOwnership = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  newOwner = throwIfMissing(),
}: IExecConsumer &
  TransferOwnershipParams): Promise<TransferOwnershipResponse> => {
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vNewOwner = addressOrEnsOrAnySchema()
    .required()
    .label('newOwner')
    .validateSync(newOwner);
  return iexec.dataset.transferDataset(vProtectedData, vNewOwner).catch((e) => {
    throw new WorkflowError(`Failed to transfer protectedData ownership`, e);
  });
};
