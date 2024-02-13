import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types/index.js';

export async function getProtectedDataById({
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
