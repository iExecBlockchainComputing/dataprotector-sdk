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

  const onSubmitChoiceRent = async ({
    isForRent,
    rentPriceInRLC,
    rentDurationInDays,
    isInSubscription,
  }: {
    isForRent: boolean;
    rentPriceInRLC: string;
    rentDurationInDays: string;
    isInSubscription: boolean;
  }) => {
    if (!isForRent && !isInSubscription) {
      toast({
        variant: 'danger',
        title: 'Please choose at least one option.',
      });
      return;
    }

    if (isForRent) {
      if (rentPriceInRLC === '' || rentDurationInDays === '') {
        toast({
          variant: 'danger',
          title: 'Please enter your price and available period.',
        });
        return;
      }

      if (Number(rentDurationInDays) === 0) {
        toast({
          variant: 'danger',
          title: 'The available period must be greater than 0.',
        });
        return;
      }

      await setToRentMutation.mutateAsync({
        priceInRLC: Number(rentPriceInRLC),
        durationInDays: Number(rentDurationInDays),
        isFinalAction: !isInSubscription,
      });
    }

    if (isInSubscription) {
      setToSubscriptionMutation.mutate();
    }
  };

  const setToRentMutation = useMutation({
    mutationKey: ['setProtectedDataToRenting'],
    mutationFn: async ({
      priceInRLC,
      durationInDays,
      // This param is actually used in onSuccess() callback
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      isFinalAction = true,
    }: {
      priceInRLC: number;
      durationInDays: number;
      isFinalAction?: boolean;
    }) => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataToRenting({
        protectedData: protectedDataAddress,
        price: rlcToNrlc(priceInRLC),
        duration: daysToSeconds(durationInDays),
      });
    },
    onSuccess: (_data, { isFinalAction = true }) => {
      toast({
        variant: 'success',
        title: 'Anyone can now rent this content.',
      });

      if (!isFinalAction) {
        // For a content that is both for rent and subscription, we don't navigate to the recap page
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ['protectedData', protectedDataAddress],
      });

      navigate({
        to: '/my-content/$protectedDataAddress/recap',
        params: {
          protectedDataAddress,
        },
      });
    },
  });

  const setToSubscriptionMutation = useMutation({
    mutationKey: ['setProtectedDataToSubscription'],
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.setProtectedDataToSubscription({
        protectedData: protectedDataAddress,
      });
    },
    onSuccess: () => {
      toast({
        variant: 'success',
        title: 'This content is now included in your subscription.',
      });

      queryClient.invalidateQueries({
        queryKey: ['protectedData', protectedDataAddress],
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
    onSubmitChoiceRent,
    setToRentMutation,
  };
}
