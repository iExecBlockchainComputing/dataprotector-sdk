import { AddressOrENS } from '@iexec/dataprotector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useToast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { rlcToNrlc } from '@/utils/rlcToNrlc.ts';

export function useSetForSaleMutation({
  protectedDataAddress,
}: {
  protectedDataAddress: AddressOrENS;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const setForSaleMutation = useMutation({
    mutationKey: ['setProtectedDataForSale'],
    mutationFn: async ({ priceInRLC }: { priceInRLC: number }) => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataForSale({
        protectedData: protectedDataAddress,
        price: rlcToNrlc(priceInRLC),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['protectedData', protectedDataAddress],
      });

      toast({
        variant: 'success',
        title: 'Monetization set successfully.',
      });

      navigate({
        to: '/my-content/$protectedDataAddress/recap',
        params: {
          protectedDataAddress,
        },
      });
    },
  });

  return {
    setForSaleMutation,
  };
}
