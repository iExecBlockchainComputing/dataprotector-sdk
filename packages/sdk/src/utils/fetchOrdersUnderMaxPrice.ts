import {
  PaginableOrders,
  PublishedApporder,
  PublishedDatasetorder,
} from 'iexec/IExecOrderbookModule';
import { DEFAULT_MAX_PRICE } from '../config/config.js';

export const fetchOrdersUnderMaxPrice = (
  datasetOrderbook: PaginableOrders<PublishedDatasetorder>,
  appOrderbook: PaginableOrders<PublishedApporder>,
  vMaxPrice = DEFAULT_MAX_PRICE
) => {
  const datasetorder = datasetOrderbook.orders[0]?.order;
  if (!datasetorder) {
    throw new Error(`No dataset orders found`);
  }
  const apporder = appOrderbook.orders[0]?.order;
  if (!apporder) {
    throw new Error(`No app orders found`);
  }

  const totalPrice = datasetorder.datasetprice + apporder.appprice;

  if (totalPrice <= vMaxPrice) {
    return {
      datasetorder,
      apporder,
    };
  }

  throw new Error(
    `No orders found within the specified price limit ${vMaxPrice} nRLC.`
  );
};
