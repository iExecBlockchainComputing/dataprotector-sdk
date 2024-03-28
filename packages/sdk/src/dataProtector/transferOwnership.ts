import { WorkflowError } from '../utils/errors.js';
import { addressOrEnsSchema, throwIfMissing } from '../utils/validators.js';
import { IExecConsumer, TransferParams, TransferResponse } from './types.js';

export const transferOwnership = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  newOwner = throwIfMissing(),
}: IExecConsumer & TransferParams): Promise<TransferResponse> => {
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vNewOwner = addressOrEnsSchema()
    .required()
    .label('newOwner')
    .validateSync(newOwner);
  return iexec.dataset.transferDataset(vProtectedData, vNewOwner).catch((e) => {
    throw new WorkflowError(`Failed to transfer protectedData ownership`, e);
  });
};
