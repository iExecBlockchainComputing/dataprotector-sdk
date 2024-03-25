import {
  GetProtectedDataPricingParams,
  GetProtectedDataPricingParamsResponse,
} from '../../index.js';
import { WorkflowError } from '../../utils/errors.js';
import { addressOrEnsSchema } from '../../utils/validators.js';
import { SubgraphConsumer } from '../types/internalTypes.js';
import { getProtectedDataPricingParamsQuery } from './subgraph/getProtectedDataPricingParamsQuery.js';

export async function getProtectedDataPricingParams({
  graphQLClient,
  protectedDataAddress,
}: SubgraphConsumer &
  GetProtectedDataPricingParams): Promise<GetProtectedDataPricingParamsResponse> {
  const vProtectedDataAddress = addressOrEnsSchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  try {
    const { protectedData } = await getProtectedDataPricingParamsQuery({
      graphQLClient,
      protectedDataAddress: vProtectedDataAddress,
    });

    if (!protectedData) {
      throw new Error('Protected data not found');
    }

    const {
      id: address,
      name,
      isRentable,
      isIncludedInSubscription,
      isForSale,
      collection,
      rentalParam,
    } = protectedData;

    // Adjust for optional collection and subscriptionParams
    let collectionResponse;
    if (collection?.subscriptionParams) {
      collectionResponse = {
        subscriptionParams: {
          price: collection.subscriptionParams.price,
          duration: collection.subscriptionParams.duration,
        },
      };
    }

    return {
      protectedDataPricingParams: {
        address,
        name,
        isRentable,
        isIncludedInSubscription,
        isForSale,
        collection: collectionResponse,
        rentalParam: rentalParam
          ? {
              price: rentalParam.price,
              duration: rentalParam.duration,
            }
          : undefined,
      },
    };
  } catch (e) {
    console.error(e);
    throw new WorkflowError('Failed to fetch protected data', e);
  }
}
