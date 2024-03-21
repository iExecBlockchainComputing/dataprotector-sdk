import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import { GetUserAppWhitelistGraphQLResponse } from '../../types/graphQLTypes.js';
import { Address } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export async function getUserAppWhitelistQuery({
  graphQLClient = throwIfMissing(),
  user,
}: SubgraphConsumer & {
  user?: Address;
}): Promise<GetUserAppWhitelistGraphQLResponse> {
  const getCreatorsQuery = gql`
    query GetAppWhitelists {
      appWhitelists(
        where: { id: "${user}" }
      ) {
        id
        owner
        app {
          id
        }
      }
    }
  `;
  const getUserAppWhitelistQueryResponse: GetUserAppWhitelistGraphQLResponse =
    await graphQLClient.request(getCreatorsQuery);
  return getUserAppWhitelistQueryResponse;
}
