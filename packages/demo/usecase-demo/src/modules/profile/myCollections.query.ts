import { queryOptions } from '@tanstack/react-query';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';

export function myCollectionsQuery({
  address,
  isConnected,
}: {
  address: string;
  isConnected: boolean;
}) {
  return queryOptions({
    queryKey: ['myCollections', address],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const { collections } = await dataProtectorSharing.getCollectionsByOwner({
        ownerAddress: address!,
      });
      return collections;
    },
    enabled: isConnected,
  });
}
