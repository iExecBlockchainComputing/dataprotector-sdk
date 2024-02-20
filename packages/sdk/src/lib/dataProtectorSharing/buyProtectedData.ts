import { GraphQLClient } from 'graphql-request';
import {
  DEFAULT_PROTECTED_DATA_SHARING_APP,
  DEFAULT_SHARING_CONTRACT_ADDRESS,
} from '../../config/config.js';
import { toHex } from '../../utils/data.js';
import { ErrorWithData, WorkflowError } from '../../utils/errors.js';
import {
  addressOrEnsOrAnySchema,
  positiveNumberSchema,
  throwIfMissing,
} from '../../utils/validators.js';
import {
  Address,
  BuyProtectedDataParams,
  IExecConsumer,
  SharingContractConsumer,
  SubgraphConsumer,
  SuccessWithTransactionHash,
} from '../types/index.js';
import { getSharingContract } from './smartContract/getSharingContract.js';
import { getCollectionById } from './subgraph/getCollectionById.js';
import { getProtectedDataById } from './subgraph/getProtectedDataById.js';

export async function buyProtectedData({
  iexec = throwIfMissing(),
  graphQLClient = throwIfMissing(),
  sharingContractAddress = throwIfMissing(),
  protectedDataAddress,
  collectionTokenIdTo,
  appAddress,
}: IExecConsumer &
  SubgraphConsumer &
  SharingContractConsumer &
  BuyProtectedDataParams): Promise<SuccessWithTransactionHash> {
  try {
    const vProtectedDataAddress = addressOrEnsOrAnySchema()
      .required()
      .label('protectedDataAddress')
      .validateSync(protectedDataAddress);

    const vCollectionTokenIdTo = positiveNumberSchema()
      .label('collectionTokenIdTo')
      .validateSync(collectionTokenIdTo);

    const vAppAddress = addressOrEnsOrAnySchema()
      .label('appAddress')
      .validateSync(appAddress);

    const userAddress = (await iexec.wallet.getAddress()).toLowerCase();

    const protectedData = await checkAndGetProtectedData({
      graphQLClient,
      protectedDataAddress: vProtectedDataAddress,
      userAddress,
    });

    let collection;
    if (vCollectionTokenIdTo) {
      collection = await checkAndGetCollection({
        graphQLClient,
        collectionTokenId: vCollectionTokenIdTo,
        userAddress,
      });
    }

    const sharingContract = await getSharingContract(
      iexec,
      sharingContractAddress
    );

    let tx;
    if (collection) {
      tx = await sharingContract.buyProtectedDataForCollection(
        protectedData.collection.id, // _collectionTokenIdFrom
        protectedData.id,
        collection.id, // _collectionTokenIdTo
        vAppAddress || DEFAULT_PROTECTED_DATA_SHARING_APP,
        {
          // TODO: See how we can remove this
          gasLimit: 900_000,
        }
      );
    } else {
      tx = await sharingContract.buyProtectedData(
        protectedData.collection.id, // _collectionTokenIdFrom
        protectedData.id,
        userAddress,
        {
          // TODO: See how we can remove this
          gasLimit: 900_000,
        }
      );
    }
    await tx.wait();

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (e) {
    throw new WorkflowError('Failed to buy Protected Data', e);
  }
}

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

  if (protectedData.owner.id === userAddress) {
    throw new ErrorWithData('This protected data is already owned by you.', {
      protectedDataAddress,
      currentOwnerAddress: protectedData.owner.id,
    });
  }

  if (protectedData.owner.id !== DEFAULT_SHARING_CONTRACT_ADDRESS) {
    throw new ErrorWithData(
      'This protected data is not owned by the sharing contract, hence cannot be bought.',
      {
        protectedDataAddress,
        currentOwnerAddress: protectedData.owner.id,
      }
    );
  }

  if (protectedData.isForSale !== true) {
    throw new ErrorWithData('This protected data is not for sale.', {
      protectedDataAddress,
    });
  }

  return protectedData;
}

async function checkAndGetCollection({
  graphQLClient,
  collectionTokenId,
  userAddress,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: number;
  userAddress: Address;
}) {
  const collection = await getCollectionById({
    graphQLClient,
    collectionTokenId: toHex(collectionTokenId),
  });

  if (!collection) {
    throw new ErrorWithData('This collection does not exist in the subgraph.', {
      collectionTokenId,
    });
  }

  if (collection.owner?.id !== userAddress) {
    throw new ErrorWithData('This collection is not owned by the user.', {
      collectionTokenId,
      currentCollectionOwnerAddress: collection.owner?.id,
    });
  }

  return collection;
}
