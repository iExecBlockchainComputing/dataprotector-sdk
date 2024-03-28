import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/components/Alert.tsx';
import { Button } from '@/components/ui/button.tsx';
import { toast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';

export function RentBlock({
  protectedDataAddress,
  rentalParams,
}: {
  protectedDataAddress: string;
  rentalParams: { price: number; duration: number };
}) {
  const queryClient = useQueryClient();

  const rentProtectedDataMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.rentProtectedData({
        protectedDataAddress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['protectedData', protectedDataAddress],
      });

      toast({
        variant: 'success',
        title: 'You can now view this content!',
      });
    },
  });

  return (
    <>
      <div className="flex w-full items-start">
        <div className="flex-1">
          This content is available for rental, and you can consume the content
          unlimitedly throughout the duration of the rental period.
        </div>
        <div className="-mt-0.5 pl-8 text-xl font-bold text-primary">
          <div className="text-center">
            <div>{rentalParams.price} nRLC</div>
            <div className="text-sm">
              for {readableSecondsToDays(rentalParams.duration)} days
            </div>
          </div>
        </div>
      </div>
      <div className="mt-7 text-center">
        <Button
          isLoading={rentProtectedDataMutation.isPending}
          onClick={() => {
            rentProtectedDataMutation.mutate();
          }}
        >
          Rent content
        </Button>
      </div>

      {rentProtectedDataMutation.isError && (
        <Alert variant="error" className="mt-7">
          <p>Oops, something went wrong while renting this content.</p>
          <p className="mt-1 text-sm text-orange-300">
            {rentProtectedDataMutation.error.toString()}
          </p>
        </Alert>
      )}
    </>
  );
}
