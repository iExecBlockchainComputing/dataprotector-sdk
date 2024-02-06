import { gql, type GraphQLClient } from 'graphql-request';
import type { Address } from '../../types.js';

export async function getCreators({
  graphQLClient,
}: {
  graphQLClient: GraphQLClient;
}) {
  const getCreatorsQuery = gql`
    query {
      accounts(first: 10) {
        id
      }
    }
  `;
  const { accounts } = await graphQLClient.request<{
    accounts: Array<{ id: Address }>;
  }>(getCreatorsQuery);
  return accounts.map((creator) => ({
    address: creator.id,
  }));
}
