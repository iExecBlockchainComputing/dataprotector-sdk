import { IExec } from 'iexec';
import { HumanSingleTag, Tag } from 'iexec/dist/lib/types';
import { WorkflowError } from './errors';
import { throwIfMissing } from './validators';

const NullAddress: string = '0x0000000000000000000000000000000000000000';

const authorize = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  datasetprice,
  volume,
  tag,
  apprestrict,
  workerpoolrestrict,
  requesterrestrict,
}: {
  iexec: IExec;
  dataset: string;
  datasetprice?: number;
  volume?: number;
  tag?: Tag | HumanSingleTag[];
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}): Promise<string> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        const orderTemplate = await iexec.order
          .createDatasetorder({
            dataset,
            datasetprice,
            volume,
            apprestrict,
            requesterrestrict,
            workerpoolrestrict,
            tag,
          })
          .catch((e) => {
            throw new WorkflowError('Failed to create dataset order', e);
          });

        const signedOrder = await iexec.order
          .signDatasetorder(orderTemplate)
          .catch((e) => {
            throw new WorkflowError('Failed to sign dataset order', e);
          });
        console.log('Signed order', signedOrder);

        const orderHash = await iexec.order
          .publishDatasetorder(signedOrder)
          .catch((e) => {
            throw new WorkflowError('Failed to publish dataset order', e);
          });
        console.log(`Order published with hash ${orderHash}`);
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

const revoke = ({
  iexec = throwIfMissing(),
  dataset = throwIfMissing(),
  apprestrict = NullAddress,
  workerpoolrestrict = NullAddress,
  requesterrestrict = NullAddress,
}: {
  iexec: IExec;
  dataset: string;
  apprestrict?: string;
  workerpoolrestrict?: string;
  requesterrestrict?: string;
}): Promise<string[]> =>
  new Promise(function (resolve, reject) {
    const start = async () => {
      try {
        console.log('dataset', dataset);
        console.log('apprestrict', apprestrict);
        console.log('workerpoolrestrict', workerpoolrestrict);
        console.log('requesterrestrict', requesterrestrict);
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

export { authorize, revoke };
