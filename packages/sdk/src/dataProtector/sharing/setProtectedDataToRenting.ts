import { GraphQLClient } from 'graphql-request';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../config/config.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  positiveStrictIntegerStringSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  IExecConsumer,
  SetProtectedDataToRentingParams,
  SuccessWithTransactionHash,
  SubgraphConsumer,
  Address,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export const setProtectedDataToRenting = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
  priceInNRLC = throwIfMissing(),
  durationInSeconds = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  SetProtectedDataToRentingParams): Promise<SuccessWithTransactionHash> => {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);
  const vPriceInNRLC = positiveNumberSchema()
    .required()
    .label('priceInNRLC')
    .validateSync(priceInNRLC);
  const vDurationInSeconds = positiveStrictIntegerStringSchema()
    .required()
    .label('durationInSeconds')
    .validateSync(durationInSeconds);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();

  const protectedData = await checkAndGetProtectedData({
    graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });

  const sharingContract = await getSharingContract();
  try {
    const tx = await sharingContract.setProtectedDataToRenting(
      protectedData.collection.id,
      protectedData.id,
      vPriceInNRLC,
      vDurationInSeconds
    );
    await tx.wait();
    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to Set Protected Data To Renting', e);
  }
};

async function checkAndGetProtectedData({
  graphQLClient,
  protectedDataAddress,
  userAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  userAddress: Address;
}) {
  const { protectedData } = await getProtectedDataById({
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

  if (protectedData.collection?.owner?.id !== userAddress) {
    throw new ErrorWithData(
      'This protected data is not part of a collection owned by the user.',
      {
        protectedDataAddress,
        currentCollectionOwnerAddress: protectedData.collection?.owner?.id,
      }
    );
  }

  if (protectedData.isForSale) {
    throw new ErrorWithData(
      'This protected data is currently for sale. First call removeProtectedDataForSale()',
      {
        protectedDataAddress,
      }
    );
  }

  if (protectedData.isRentable) {
    throw new ErrorWithData('This protected data is already for rent.', {
      protectedDataAddress,
    });
  }

  return protectedData;
}
