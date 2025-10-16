import { IExec, utils } from 'iexec';

export interface CreateBulkOrderParams {
  dataset: string;
  app: string;
  requester: string;
  tag?: string[];
}

export const createBulkOrder = async (
  iexec: IExec,
  { dataset, app, requester, tag = ['tee', 'scone'] }: CreateBulkOrderParams
) => {
  const bulkOrder = await iexec.order.createDatasetorder({
    dataset: dataset,
    datasetprice: 0,
    volume: utils.DATASET_INFINITE_VOLUME,
    apprestrict: app,
    requesterrestrict: requester,
    tag,
  });

  const signedBulkOrder = await iexec.order.signDatasetorder(bulkOrder, {
    preflightCheck: false,
  });

  return signedBulkOrder;
};
