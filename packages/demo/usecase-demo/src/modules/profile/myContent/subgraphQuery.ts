import type { Connector } from 'wagmi';
import { gql } from 'graphql-request';
import { type Address } from '@iexec/dataprotector';
import { getDataProtectorClient } from '../../../externals/dataProtectorClient.ts';

export async function getMyContent({
  connector,
  userAddress,
}: {
  connector: Connector;
  userAddress: Address;
}) {
  const dataProtector = await getDataProtectorClient({
    connector,
  });
  const myContentQuery = gql`
    query {
      account(id: "${userAddress}") {
        id
        datasets(where: {collection_: {id_not: "null"}}) {
          id
          name
          collection {
            id
          }
        }
      }
    }
  `;
  const contentOfTheWeekData: {
    account: {
      id: Address;
      datasets: Array<{
        id: Address;
        name: string;
        collection: {
          id: number;
        };
      }>;
    };
  } = await dataProtector.getGraphQLClient().request(myContentQuery);
  if (!contentOfTheWeekData.account) {
    return [];
  }
  return contentOfTheWeekData.account.datasets.map((protectedData) => ({
    address: protectedData.id,
    ...protectedData,
  }));
}
