import { Address } from '@/types';
import { queryOptions } from '@tanstack/react-query';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';

export function activeSubscriptionsQuery({
  userAddress,
}: {
  userAddress: Address;
}) {
  return queryOptions({
    queryKey: ['activeSubscriptions', userAddress],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const { collectionSubscriptions } =
        await dataProtectorSharing.getCollectionSubscriptions({
          subscriberAddress: userAddress,
          includePastSubscriptions: false,
        });
      return collectionSubscriptions;
    },
  });
}
