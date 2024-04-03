import { AddressOrENS } from '@iexec/dataprotector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useToast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { rlcToNrlc } from '@/utils/rlcToNrlc.ts';
import { daysToSeconds } from '@/utils/secondsToDays.ts';

export function useSetToRentMutation({
  protectedDataAddress,
}: {
  protectedDataAddress: AddressOrENS;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const setToRentMutation = useMutation({
    mutationFn: async ({
      priceInRLC,
      durationInDays,
    }: {
      priceInRLC: number;
      durationInDays: number;
    }) => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataToRenting({
        protectedDataAddress,
        priceInNRLC: rlcToNrlc(priceInRLC),
        durationInSeconds: daysToSeconds(durationInDays),
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
        to: '/my-content/edit/$protectedDataAddress/recap',
        params: {
          protectedDataAddress,
        },
      });
    },
  });

  return {
    setToRentMutation,
  };
}
