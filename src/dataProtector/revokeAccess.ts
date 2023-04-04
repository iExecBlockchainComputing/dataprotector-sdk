import { NULL_ADDRESS } from '../config';
import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { IRevokeOptions } from './types';

export const revokeAccess = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  apprestrict = NULL_ADDRESS,
  workerpoolrestrict = NULL_ADDRESS,
  requesterrestrict = NULL_ADDRESS,
}: IRevokeOptions): Promise<string[]> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const publishedDatasetorders = await iexec.orderbook
          .fetchDatasetOrderbook(dataset, {
            app: apprestrict,
            workerpool: workerpoolrestrict,
            requester: requesterrestrict,
          })
          .catch((e) => {
            throw new WorkflowError('Failed to fetch dataset orderbook', e);
          });
        const tab_tx = await Promise.all(
          publishedDatasetorders.orders.map(async (e) => {
            return (await iexec.order.cancelDatasetorder(e.order)).txHash;
          })
        );
        if (tab_tx.length == 0) {
          reject('No order to revoke');
        }
        resolve(tab_tx);
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
