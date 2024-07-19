import { queryOptions } from '@tanstack/react-query';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';

export function myCollectionsQuery({
  address,
  includeHiddenProtectedDatas = false,
}: {
  address: string;
  includeHiddenProtectedDatas?: boolean;
}) {
  return queryOptions({
    queryKey: ['myCollections', address],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const { collections } = await dataProtectorSharing.getCollectionsByOwner({
        owner: address!,
        includeHiddenProtectedDatas,
      });
      return collections;
    },
  });
}
