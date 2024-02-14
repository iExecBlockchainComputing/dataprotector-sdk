import { gql, type GraphQLClient } from 'graphql-request';
import { GetProtectedDataByIdGraphQLResponse } from '../../types/graphQLTypes.js';
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
  const { protectedData }: GetProtectedDataByIdGraphQLResponse =
    await graphQLClient.request(getProtectedDataQuery);
  return protectedData;
}
