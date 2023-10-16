import {
  PaginableOrders,
  PublishedApporder,
  PublishedDatasetorder,
  PublishedWorkerpoolorder,
} from 'iexec/IExecOrderbookModule';
import { validateOrders } from './validators.js';
import { DEFAULT_MAX_PRICE } from '../config/config.js';

export const fetchOrdersUnderMaxPrice = (
  datasetOrderbook: PaginableOrders<PublishedDatasetorder>,
  appOrderbook: PaginableOrders<PublishedApporder>,
  workerpoolOrderbook: PaginableOrders<PublishedWorkerpoolorder>,
  vMaxPrice = DEFAULT_MAX_PRICE
) => {
  validateOrders(datasetOrderbook.orders, 'dataset');
  validateOrders(appOrderbook.orders, 'app');
  validateOrders(workerpoolOrderbook.orders, 'workerpool');

  const datasetorder = datasetOrderbook.orders[0]?.order;
  const apporder = appOrderbook.orders[0]?.order;
  const workerpoolorder = workerpoolOrderbook.orders[0]?.order;

  const totalPrice =
    datasetorder.datasetprice +
    apporder.appprice +
    workerpoolorder.workerpoolprice;

  if (totalPrice <= vMaxPrice) {
    return {
      datasetorder,
      apporder,
      workerpoolorder,
    };
  }

  throw new Error(
    `No orders found within the specified price limit ${vMaxPrice} nRLC.`
  );
};
