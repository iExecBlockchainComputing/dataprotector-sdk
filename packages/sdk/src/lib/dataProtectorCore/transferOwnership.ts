import { WorkflowError } from '../../utils/errors.js';
import { addressOrEnsSchema, isValidProvider, throwIfMissing } from '../../utils/validators.js';
import { TransferParams, TransferResponse } from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export const transferOwnership = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  newOwner = throwIfMissing(),
}: IExecConsumer & TransferParams): Promise<TransferResponse> => {
  await isValidProvider(iexec);
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);
  const vNewOwner = addressOrEnsSchema()
    .required()
    .label('newOwner')
    .validateSync(newOwner);

  return iexec.dataset.transferDataset(vProtectedData, vNewOwner).catch((e) => {
    throw new WorkflowError('Failed to transfer protectedData ownership', e);
  });
};
