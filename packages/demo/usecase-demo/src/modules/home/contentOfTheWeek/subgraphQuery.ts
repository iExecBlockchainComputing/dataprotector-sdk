import { gql } from 'graphql-request';
import type { Address, ProtectedData } from '@iexec/dataprotector';
import { getDataProtectorClient } from '../../../externals/dataProtectorClient.ts';

export async function getContentOfTheWeek(): Promise<ProtectedData[]> {
  const dataProtector = await getDataProtectorClient();
  const sevenDaysAgo = Math.round(
    (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
  );
  const contentOfTheWeekQuery = gql`
    query {
      protectedDatas(
        where: {
          transactionHash_not: "0x",
          owner: "${import.meta.env.VITE_CONTENT_CREATOR_SMART_CONTRACT_ADDRESS.toLowerCase()}",
          creationTimestamp_gte: "${sevenDaysAgo}",
        },
        first: 10
        orderBy: creationTimestamp
        orderDirection: desc
      ) {
        id
        name
        owner {
          id
        }
        creationTimestamp
      }
    }
  `;
  const contentOfTheWeekData: {
    protectedDatas: Array<{
      id: Address;
      name: string;
      owner: { id: Address };
      creationTimestamp: string;
    }>;
  } = await dataProtector.getGraphQLClient().request(contentOfTheWeekQuery);
  return contentOfTheWeekData.protectedDatas.map((protectedData) => ({
    address: protectedData.id,
    ...protectedData,
  }));
}
