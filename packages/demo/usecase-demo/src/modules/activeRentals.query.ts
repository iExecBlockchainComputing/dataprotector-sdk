import { Address } from '@/types';
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
      // Add fake delay for tests, to better see loading state
      // return new Promise((resolve) => {
      //   setTimeout(() => {
      //     resolve(rentals);
      //   }, 1000);
      // });
    },
  });
}
