import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button.tsx';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
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
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={!collection?.subscriptionParams}>Subscribe</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscription to {collection.id}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          This action cannot be undone. This will permanently delete your
          account and remove your data from our servers.
        </DialogDescription>
        <DialogFooter className="justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={subscribeMutation.isPending}
            isLoading={subscribeMutation.isPending}
            onClick={() => {
              subscribeMutation.mutate();
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
