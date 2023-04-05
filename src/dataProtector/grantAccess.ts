import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { GrantAccessOptions } from './types';

export const grantAccess = async ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  datasetprice,
  volume,
  tag,
  apprestrict,
  workerpoolrestrict,
  requesterrestrict,
}: GrantAccessOptions): Promise<string> => {
  try {
    const orderTemplate = await iexec.order.createDatasetorder({
      dataset,
      datasetprice,
      volume,
      tag,
      apprestrict,
      workerpoolrestrict,
      requesterrestrict,
    });
    const signedOrder = await iexec.order.signDatasetorder(orderTemplate);
    const orderHash = await iexec.order.publishDatasetorder(signedOrder);
    return orderHash;
  } catch (error) {
    throw new WorkflowError(`Failed to grant access: ${error.message}`, error);
  }
};
