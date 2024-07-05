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
  protectedData,
}: SubgraphConsumer &
  GetProtectedDataPricingParams): Promise<GetProtectedDataPricingParamsResponse> {
  const vProtectedData = addressOrEnsSchema()
    .required()
    .label('protectedData')
    .validateSync(protectedData);

  try {
    const { protectedData: oneProtectedData } =
      await getProtectedDataPricingParamsQuery({
        graphQLClient,
        protectedData: vProtectedData,
      });

    if (!oneProtectedData) {
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
    } = oneProtectedData;

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
    throw new WorkflowError({
      message: 'Failed to get protected data pricing params',
      errorCause: e,
    });
  }
}
