import { gql, type GraphQLClient } from 'graphql-request';
import { toHex } from '../../utils/data.js';
import type { Address } from '../types.js';

type Collections = {
  collections: { id: string }[];
};

type CollectionOwner = {
  collection: {
    owner: {
      id: string;
    };
  };
};

type CollectionProtectedDatas = {
  collection: {
    protectedDatas: { id: string }[];
  };
};

export async function collectionExists({
  graphQLClient,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  collectionTokenId: number;
}): Promise<boolean> {
  const getCollectionOwnerQuery = gql`
    query ($collection: String!) {
      collections(where: { id: $collection }) {
        id
      }
    }
  `;
  const variables = {
    collection: toHex(collectionTokenId),
  };
  const getCollection: Collections = await graphQLClient.request(
    getCollectionOwnerQuery,
    variables
  );
  return getCollection.collections.length > 0;
}

export async function isCollectionOwner({
  graphQLClient,
  walletAddress,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  walletAddress: Address;
  collectionTokenId: number;
}): Promise<boolean> {
  const getCollectionOwnerQuery = gql`
    query ($collection: String!) {
      collection(id: $collection) {
        owner {
          id
        }
      }
    }
  `;
  const variables = {
    collection: toHex(collectionTokenId),
  };
  const getCollectionOwner: CollectionOwner = await graphQLClient.request(
    getCollectionOwnerQuery,
    variables
  );
  return (
    getCollectionOwner.collection.owner?.id === walletAddress.toLowerCase()
  );
}

export async function isProtectedDataInCollection({
  graphQLClient,
  protectedDataAddress,
  collectionTokenId,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  collectionTokenId: number;
}): Promise<boolean> {
  const getCollectionOwnerQuery = gql`
    query ($collection: String!, $protectedDataAddress: String!) {
      collection(id: $collection) {
        protectedDatas(where: { id: $protectedDataAddress }) {
          id
        }
      }
    }
  `;
  const variables = {
    collection: toHex(collectionTokenId),
    protectedDataAddress: protectedDataAddress.toLowerCase(),
  };
  const getCollectionOwner: CollectionProtectedDatas =
    await graphQLClient.request(getCollectionOwnerQuery, variables);
  return getCollectionOwner.collection.protectedDatas.length > 0;
}
