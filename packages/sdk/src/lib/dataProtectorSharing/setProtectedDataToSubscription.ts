import { GraphQLClient } from 'graphql-request';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../config/config.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  Address,
  IExecConsumer,
  SetProtectedDataToSubscriptionParams,
  SharingContractConsumer,
  SubgraphConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export const setProtectedDataToSubscription = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress = throwIfMissing(),
}: IExecConsumer &
  SubgraphConsumer &
  SharingContractConsumer &
  SetProtectedDataToSubscriptionParams): Promise<SuccessWithTransactionHash> => {
  const vProtectedDataAddress = addressOrEnsOrAnySchema()
    .required()
    .label('protectedDataAddress')
    .validateSync(protectedDataAddress);

  const userAddress = (await iexec.wallet.getAddress()).toLowerCase();
  const protectedData = await checkAndGetProtectedData({
    graphQLClient,
    protectedDataAddress: vProtectedDataAddress,
    userAddress,
  });

  try {
    const sharingContract = await getSharingContract(
      iexec,
      sharingContractAddress
    );
    const tx = await sharingContract.setProtectedDataToSubscription(
      protectedData.collection.id,
      protectedData.id
    );
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError(
      'Failed to set ProtectedData To Subscription into sharing smart contract',
      e
    );
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
      'This protected data is not owned by the sharing contract, hence a sharing-related method cannot be called.',
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

  if (protectedData.isIncludedInSubscription) {
    throw new ErrorWithData(
      'This protected data is already included in subscription.',
      {
        protectedDataAddress,
      }
    );
  }

  return protectedData;
}
