import { queryOptions } from '@tanstack/react-query';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';

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
      const dataProtector = await getDataProtectorClient();
      return dataProtector.getCollectionsByOwner({ ownerAddress: address! });
    },
    enabled: isConnected,
  });
}
