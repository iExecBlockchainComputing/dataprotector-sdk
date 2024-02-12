import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../dataProtector/types.js';
import { toHex } from './data.js';
type Collection = {
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
export async function isCollectionOwner({
  graphQLClient,
  walletAddress,
  collectionId,
}: {
  graphQLClient: GraphQLClient;
  walletAddress: Address;
  collectionId: number;
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
    collection: toHex(collectionId),
  };
  const getCollectionOwner: Collection = await graphQLClient.request(
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
  collectionId,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
  collectionId: number;
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
    collection: toHex(collectionId),
    protectedDataAddress: protectedDataAddress.toLowerCase(),
  };
  const getCollectionOwner: CollectionProtectedDatas =
    await graphQLClient.request(getCollectionOwnerQuery, variables);
  return getCollectionOwner.collection.protectedDatas.length > 0;
}
