import { gql, type GraphQLClient } from 'graphql-request';
import { GetCreatorsGraphQLResponse } from '../../types/graphQLTypes.js';
import { Creator } from '../../types/index.js';

export async function getCreators({
  graphQLClient,
}: {
  graphQLClient: GraphQLClient;
}): Promise<Creator[]> {
  const getCreatorsQuery = gql`
    query Creators {
      accounts(first: 10) {
        id
      }
    }
  `;
  const { accounts }: GetCreatorsGraphQLResponse = await graphQLClient.request(
    getCreatorsQuery
  );
  return accounts.map((creator) => ({
    address: creator.id,
  }));
}
