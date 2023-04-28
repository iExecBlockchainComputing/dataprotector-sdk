import { IExecConsumer, Order } from './types.js';
import { WorkflowError } from '../utils/errors.js';
import { throwIfMissing } from '../utils/validators.js';
import { Observable } from '../utils/reactive.js';

export const revokeOneAccess = async ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  datasetprice = throwIfMissing(),
  volume = throwIfMissing(),
  tag = throwIfMissing(),
  apprestrict = throwIfMissing(),
  workerpoolrestrict = throwIfMissing(),
  requesterrestrict = throwIfMissing(),
  salt = throwIfMissing(),
  sign = throwIfMissing(),
}: IExecConsumer & Order): Promise<{ order: Order; txHash: string }> => {
  try {
    const { order, txHash } = await iexec.order.cancelDatasetorder({
      apprestrict: apprestrict,
      dataset: dataset,
      datasetprice: datasetprice,
      requesterrestrict: requesterrestrict,
      salt: salt,
      sign: sign,
      tag: tag,
      volume: volume,
      workerpoolrestrict: workerpoolrestrict,
    });
    return { order, txHash };
  } catch (error) {
    throw new WorkflowError(
      `Failed to cancel this granted access: ${error.message}`,
      error
    );
  }
};
