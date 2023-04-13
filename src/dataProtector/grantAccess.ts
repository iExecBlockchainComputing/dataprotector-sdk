import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { GrantAccessOptions } from './types';

export const grantAccess = async ({
  iexec = throwIfMissing(),
  dataAddress = throwIfMissing(),
  appRestrictAddress = 'any',
  requesterRestrictAddress = 'any',
  dataUsagePrice,
  numberOfAccess,
  tag,
}: GrantAccessOptions): Promise<string> => {
  try {
    const publishedDatasetOrders = await iexec.orderbook.fetchDatasetOrderbook(
      dataAddress,
      {
        app: appRestrictAddress,
        requester: requesterRestrictAddress,
        minVolume: numberOfAccess,
        minTag: tag,
      }
    );
    const authorizedApp = publishedDatasetOrders?.orders.find(
      (el) =>
        el.order.apprestrict.toLowerCase() === appRestrictAddress?.toLowerCase()
    );
    const authorizedUser = publishedDatasetOrders?.orders.find(
      (el) =>
        el.order.requesterrestrict.toLowerCase() ===
        requesterRestrictAddress?.toLowerCase()
    );
    if (authorizedUser || authorizedApp) {
      throw new Error(
        'an access has been already granted to this user/application'
      );
    }
    const datasetorderTemplate = await iexec.order.createDatasetorder({
      dataset: dataAddress,
      apprestrict: appRestrictAddress,
      requesterrestrict: requesterRestrictAddress,
      datasetprice: dataUsagePrice,
      volume: numberOfAccess,
      tag: tag,
    });
    const datasetorder = await iexec.order.signDatasetorder(
      datasetorderTemplate
    );
    const orderHash = await iexec.order.publishDatasetorder(datasetorder);
    return orderHash;
  } catch (error) {
    throw new WorkflowError(`Failed to grant access: ${error.message}`, error);
  }
};
