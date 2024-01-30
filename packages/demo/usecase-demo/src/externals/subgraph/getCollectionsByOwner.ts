import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { gql } from 'graphql-request';
import { type Address } from '@iexec/dataprotector';

type Collection = {
  id: number;
};

export async function getCollectionsByOwner({
  connector,
  ownerAddress,
}: {
  connector: any;
  ownerAddress: Address;
}): Promise<Collection[]> {
  const dataProtector = await getDataProtectorClient({
    connector,
  });
  const contentOfTheWeekQuery = gql`
    query {
      collections(
        where: {
          owner: "${ownerAddress.toLowerCase()}",
        },
        orderBy: creationTimestamp
        orderDirection: desc
      ) {
        id
      }
    }
  `;
  const collectionsData: {
    collections: Collection[];
  } = await dataProtector.getGraphQLClient().request(contentOfTheWeekQuery);
  return collectionsData.collections;
}
