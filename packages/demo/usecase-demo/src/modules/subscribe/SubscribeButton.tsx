import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button.tsx';
import { useToast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';

export function SubscribeButton({
  collection,
}: {
  collection: CollectionWithProtectedDatas;
}) {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!collection) {
        return;
      }
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.subscribeToCollection({
        collectionTokenId: collection.id,
        duration: collection.subscriptionParams.duration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collections', collection.owner.id],
      });
      toast({
        variant: 'success',
        title: 'Subscription added',
      });
    },
  });

  return (
    <Button
      disabled={!collection?.subscriptionParams}
      isLoading={subscribeMutation.isPending}
      onClick={() => {
        subscribeMutation.mutate();
      }}
    >
      Subscribe
    </Button>
  );
}
