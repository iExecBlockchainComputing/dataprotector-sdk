import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types.js';

export async function getProtectedData({
  graphQLClient,
  protectedDataAddress,
}: {
  graphQLClient: GraphQLClient;
  protectedDataAddress: Address;
}) {
  const getProtectedDataQuery = gql`
    query  {
      protectedData(
        id: "${protectedDataAddress}"
      ) {
        id
        name
        owner {
          id
        }
      }
    }
  `;
  const { protectedData } = await graphQLClient.request<{
    protectedData: { id: Address; name: string; owner: { id: Address } };
  }>(getProtectedDataQuery);
  return protectedData;
}
