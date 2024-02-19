import { ethers } from 'ethers';
import { GraphQLClient } from 'graphql-request';
import {
  DEFAULT_SHARING_CONTRACT_ADDRESS,
  SCONE_TAG,
  WORKERPOOL_ADDRESS,
} from '../../config/config.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  SubgraphConsumer,
  ConsumeProtectedDataParams,
  SuccessWithTransactionHash,
  IExecConsumer,
  Address,
} from '../types/index.js';
import { getPocoAppRegistryContract } from './smartContract/getPocoRegistryContract.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export const consumeProtectedData = async ({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  protectedDataAddress,
}: IExecConsumer &
  SubgraphConsumer &
  ConsumeProtectedDataParams): Promise<SuccessWithTransactionHash> => {
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
    const contentPath = '';
    // get the app set to consume the protectedData
    const sharingContract = await getSharingContract();
    const appAddress = await sharingContract.appForProtectedData(
      protectedData.collection.id,
      protectedData.id
    );

    const pocoAppRegistryContract = await getPocoAppRegistryContract();
    const appTokenId = ethers.getBigInt(appAddress).toString();
    const appOwner = (
      await pocoAppRegistryContract.ownerOf(appTokenId)
    ).toLowerCase();
    if (appOwner === DEFAULT_SHARING_CONTRACT_ADDRESS) {
      throw new Error(
        'The App is not owner by the protectedDataSharing Contract'
      );
    }

    const workerpoolOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: WORKERPOOL_ADDRESS,
      app: appAddress,
      dataset: vProtectedDataAddress,
      minTag: SCONE_TAG,
      maxTag: SCONE_TAG,
    });
    const workerpoolOrder = workerpoolOrderbook.orders[0]?.order;
    if (workerpoolOrder.workerpoolprice > 0) {
      throw new Error('No workerpool order free');
    }

    const tx = await sharingContract.consumeProtectedData(
      protectedData.collection.id,
      protectedData.id,
      workerpoolOrder,
      contentPath,
      {
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
    throw new WorkflowError(
      'Sharing smart contract: Failed to subscribe to collection',
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

  if (!protectedData.isRentable) {
    throw new ErrorWithData('This protected data is already for rent.', {
      protectedDataAddress,
    });
  }

  const hasActiveRentals = protectedData.rentals.some(
    (rental) => rental.renter === userAddress
  );
  if (!hasActiveRentals) {
    throw new ErrorWithData('You have a still active rentals protected data.', {
      protectedDataAddress,
      activeRentalsCount: protectedData.rentals.length,
    });
  }

  // TODO: remove & set somewhere else
  const hasActiveSubscriptions = protectedData.collection.subscriptions.some(
    (subscription) => subscription.subscriber.id === userAddress
  );
  if (!hasActiveSubscriptions) {
    throw new ErrorWithData('This collection has not valid subscription', {
      collectionId: protectedData.collection.id,
      currentCollectionOwnerAddress: protectedData.collection.owner?.id,
    });
  }

  return protectedData;
}
