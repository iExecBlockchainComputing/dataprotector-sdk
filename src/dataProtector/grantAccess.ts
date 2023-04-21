import { WorkflowError } from '../utils/errors';
import { throwIfMissing } from '../utils/validators';
import { GrantAccessParams, IExecConsumer } from './types';

export const grantAccess = async ({
  iexec = throwIfMissing(),
  protectedData = throwIfMissing(),
  authorizedApp = throwIfMissing(),
  authorizedUser = throwIfMissing(),
  pricePerAccess,
  numberOfAccess,
  tag,
}: IExecConsumer & GrantAccessParams): Promise<string> => {
  try {
    const publishedDatasetOrders = await iexec.orderbook.fetchDatasetOrderbook(
      protectedData,
      {
        app: authorizedApp,
        requester: authorizedUser,
        minVolume: numberOfAccess,
        minTag: tag,
      }
    );
    const authorizedAppOrder = publishedDatasetOrders?.orders.find(
      (el) =>
        el.order.apprestrict.toLowerCase() === authorizedApp?.toLowerCase()
    );
    const authorizedUserOrder = publishedDatasetOrders?.orders.find(
      (el) =>
        el.order.requesterrestrict.toLowerCase() ===
        authorizedUser?.toLowerCase()
    );
    if (authorizedUserOrder || authorizedAppOrder) {
      throw new Error(
        'an access has been already granted to this user/application'
      );
    }
    const datasetorderTemplate = await iexec.order.createDatasetorder({
      dataset: protectedData,
      apprestrict: authorizedApp,
      requesterrestrict: authorizedUser,
      datasetprice: pricePerAccess,
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
