import { Address } from 'wagmi';
import { queryOptions } from '@tanstack/react-query';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';

export function activeRentalsQuery({ userAddress }: { userAddress: Address }) {
  return queryOptions({
    queryKey: ['activeRentals', userAddress],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      const { rentals } = await dataProtectorSharing.getRentals({
        renterAddress: userAddress,
        includePastRentals: false,
      });
      return rentals;
    },
  });
}
