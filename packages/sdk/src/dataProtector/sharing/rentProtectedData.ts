import { GraphQLClient } from 'graphql-request';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../config/config.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  Address,
  RentProtectedDataParams,
  SubgraphConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export const rentProtectedData = async ({
  graphQLClient = throwIfMissing(),
  protectedDataAddress,
}: SubgraphConsumer &
  RentProtectedDataParams): Promise<SuccessWithTransactionHash> => {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const { protectedData, rentalParam } = await checkAndGetProtectedData({
    graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
  });

  try {
    const sharingContract = await getSharingContract();
    const tx = await sharingContract.rentProtectedData(
      protectedData.collection.id,
      protectedData.id,
      {
        value: rentalParam.price,
        // TODO: See how we can remove this
        gasLimit: 900_000,
      }
    );
    await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to rent Protected Data', e);
  }
};

async function checkAndGetProtectedData({
  graphQLClient,
  protectedDataAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
}) {
  const { protectedData, rentalParam } = await getProtectedDataById({
    graphQLClient,
    protectedDataAddress,
  });

  if (!protectedData) {
    throw new ErrorWithData(
      'This protected data does not exist in the subgraph.',
      { protectedDataAddress }
    );
  }

  if (protectedData.owner.id !== DEFAULT_SHARING_CONTRACT_ADDRESS) {
    throw new ErrorWithData(
      'This protected data is not owned by the sharing contract.',
      {
        protectedDataAddress,
        currentOwnerAddress: protectedData.owner.id,
      }
    );
  }

  const hasActiveRentals = protectedData.rentals.length > 0;
  if (hasActiveRentals) {
    throw new ErrorWithData('You have a still active rentals protected data.', {
      protectedDataAddress,
      activeRentalsCount: protectedData.rentals.length,
    });
  }

  return { protectedData, rentalParam };
}
