import {
  PaginableOrders,
  PublishedApporder,
  PublishedDatasetorder,
  PublishedWorkerpoolorder,
} from 'iexec/IExecOrderbookModule';
import { validateOrders } from './validators.js';

export const fetchOrdersUnderMaxPrice = (
  datasetOrderbook: PaginableOrders<PublishedDatasetorder>,
  appOrderbook: PaginableOrders<PublishedApporder>,
  workerpoolOrderbook: PaginableOrders<PublishedWorkerpoolorder>,
  vMaxPrice?: number | undefined
) => {
  validateOrders(datasetOrderbook.orders, 'dataset');
  validateOrders(appOrderbook.orders, 'app');
  validateOrders(workerpoolOrderbook.orders, 'workerpool');

  if (vMaxPrice === undefined) {
    return {
      datasetorder: datasetOrderbook.orders[0]?.order,
      apporder: appOrderbook.orders[0]?.order,
      workerpoolorder: workerpoolOrderbook.orders[0]?.order,
    };
  }

  for (const workerpoolorder of workerpoolOrderbook.orders) {
    for (const apporder of appOrderbook.orders) {
      for (const datasetorder of datasetOrderbook.orders) {
        const totalPrice =
          datasetorder.order.datasetprice +
          apporder.order.appprice +
          workerpoolorder.order.workerpoolprice;

        if (totalPrice <= vMaxPrice) {
          return {
            datasetorder: datasetorder.order,
            apporder: apporder.order,
            workerpoolorder: workerpoolorder.order,
          };
        }
      }
    }
  }
  throw new Error('No orders found within the specified price limit.');
};
