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
  const getCreatorsQuery = gql`
    query {
      addOnlyAppWhitelists(
        where: { owner: "${user}" }
      ) {
        id
        owner
        app {
          id
        }
      }
    }
  `;
  const getUserAddOnlyAppWhitelistQueryResponse: GetUserAddOnlyAppWhitelistGraphQLResponse =
    await graphQLClient.request(getCreatorsQuery);
  return getUserAddOnlyAppWhitelistQueryResponse;
}
