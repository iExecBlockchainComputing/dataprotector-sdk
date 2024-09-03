import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@/components/Alert.tsx';
import { Button } from '@/components/ui/button.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';

export function BuyBlock({
  protectedDataAddress,
  salePriceInNRLC,
}: {
  protectedDataAddress: string;
  salePriceInNRLC: number;
}) {
  const queryClient = useQueryClient();

  const buyProtectedDataMutation = useMutation({
    mutationKey: ['buyProtectedData'],
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.buyProtectedData({
        protectedData: protectedDataAddress,
        price: salePriceInNRLC,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['protectedData', protectedDataAddress],
      });
    },
  });

  return (
    <div className="mb-6 mt-9">
      <div className="flex w-full items-start">
        <div className="flex-1">
          This content is for purchase, and the content creator grants you
          exclusive ownership of this content.
        </div>
        <div className="pl-6 text-xl font-bold text-primary">
          {nrlcToRlc(salePriceInNRLC)} RLC
        </div>
      </div>
      <div className="mt-7 text-center">
        <Button
          isLoading={buyProtectedDataMutation.isPending}
          onClick={() => buyProtectedDataMutation.mutate()}
        >
          Buy content
        </Button>
      </div>

      {buyProtectedDataMutation.isError && (
        <Alert variant="error" className="mt-7">
          <p>Oops, something went wrong while buying this content.</p>
          <p className="mt-1 text-sm">
            {buyProtectedDataMutation.error.toString()}
          </p>
        </Alert>
      )}
    </div>
  );
}
