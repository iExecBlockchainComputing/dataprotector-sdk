import {
  PaginableOrders,
  PublishedApporder,
  PublishedDatasetorder,
  PublishedWorkerpoolorder,
} from 'iexec/IExecOrderbookModule';
import { DEFAULT_MAX_PRICE } from '../config/config.js';
import { validateOrders } from './validators.js';

export const fetchOrdersUnderMaxPrice = (
  datasetOrderbook: PaginableOrders<PublishedDatasetorder>,
  appOrderbook: PaginableOrders<PublishedApporder>,
  workerpoolOrderbook: PaginableOrders<PublishedWorkerpoolorder>,
  vMaxPrice = DEFAULT_MAX_PRICE
) => {
  validateOrders().label('dataset').validateSync(datasetOrderbook.orders);
  validateOrders().label('app').validateSync(appOrderbook.orders);
  validateOrders().label('workerpool').validateSync(workerpoolOrderbook.orders);

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
