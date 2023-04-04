import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { IGrantOptions } from './types';

export const grantAccess = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  datasetprice,
  volume,
  tag,
  apprestrict,
  workerpoolrestrict,
  requesterrestrict,
}: IGrantOptions): Promise<string> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const orderTemplate = await iexec.order
          .createDatasetorder({
            dataset,
            datasetprice,
            volume,
            tag,
            apprestrict,
            workerpoolrestrict,
            requesterrestrict,
          })
          .catch((e) => {
            throw new WorkflowError('Failed to create dataset order', e);
          });
        const signedOrder = await iexec.order
          .signDatasetorder(orderTemplate)
          .catch((e) => {
            throw new WorkflowError('Failed to sign dataset order', e);
          });
        const orderHash = await iexec.order
          .publishDatasetorder(signedOrder)
          .catch((e) => {
            throw new WorkflowError('Failed to publish dataset order', e);
          });
        resolve(orderHash);
      } catch (e: any) {
        if (e instanceof WorkflowError) {
          reject(e);
        } else {
          reject(new WorkflowError('Order publish unexpected error', e));
        }
      }
    };
    start();
  });
