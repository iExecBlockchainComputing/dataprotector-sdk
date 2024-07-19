import { gql } from 'graphql-request';
import { throwIfMissing } from '../../../utils/validators.js';
import { GetUserAddOnlyAppWhitelistGraphQLResponse } from '../../types/graphQLTypes.js';
import { Address } from '../../types/index.js';
import { SubgraphConsumer } from '../../types/internalTypes.js';

export async function getUserAddOnlyAppWhitelistQuery({
  graphQLClient = throwIfMissing(),
  user,
}: SubgraphConsumer & {
  user: Address;
}): Promise<GetUserAddOnlyAppWhitelistGraphQLResponse> {
  const addOnlyAppWhitelistsQuery = gql`
    query {
      addOnlyAppWhitelists(
        where: { owner: "${user}" }
      ) {
        id
        owner {
          id
        }
        apps {
          id
        }
      }
    }
  `;

  return graphQLClient.request<GetUserAddOnlyAppWhitelistGraphQLResponse>(
    addOnlyAppWhitelistsQuery
  );
}
