import { useToast } from '@/components/ui/use-toast.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Loader } from 'react-feather';
import { Alert } from '../components/Alert.tsx';
import { Button } from '../components/ui/button.tsx';
import { getDataProtectorClient } from '../externals/dataProtectorClient.ts';
import { getEnsForAddress } from '../externals/getEnsForAddress.ts';
import { useUserStore } from '../stores/user.store.ts';
import { readableSecondsToDays } from '../utils/secondsToDays.ts';
import { timestampToReadableDate } from '../utils/timestampToReadableDate.ts';
import styles from './_profile.module.css';

export const Route = createFileRoute('/user/$userId')({
  component: UserProfile,
});

export function UserProfile() {
  const { userId } = Route.useParams();

  const { toast } = useToast();

  const { isConnected } = useUserStore();
  const queryClient = useQueryClient();

  const [ensName, setEnsName] = useState();

  useEffect(() => {
    function getEns() {
      return getEnsForAddress(userId);
    }
    getEns().then((ens) => {
      ens && setEnsName(ens);
    });
  }, []);

  const { isLoading, data: collections } = useQuery({
    queryKey: ['collections', userId],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.getCollectionsByOwner({
        ownerAddress: userId,
      });
    },
    enabled: isConnected,
  });

  const firstUserCollection = collections?.[0];

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!collections?.[0]) {
        return;
      }
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.subscribe({
        collectionTokenId: collections[0].id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', userId] });
      toast({
        variant: 'success',
        title: 'Subscription added',
      });
    },
  });

  return (
    <div>
      <div
        className={clsx(
          styles['profile-banner'],
          'profile-banner relative mb-[95px] h-[250px] w-full rounded-3xl border border-grey-700'
        )}
      >
        <div className="absolute -bottom-[40px] left-[40px] size-[140px] rounded-full border-[5px] border-[#D9D9D9] bg-black"></div>
      </div>

      <div className="mt-10">User {userId}</div>

      {ensName && <div>{ensName}</div>}

      {isLoading && <div className="mt-3">Loading...</div>}

      {collections?.length === 0 && (
        <div className="mt-3 italic">No collections found for this user</div>
      )}

      {firstUserCollection && (
        <div className="mt-3">
          <div>Collection no: {firstUserCollection.id}</div>
          <div>
            Created:{' '}
            {timestampToReadableDate(firstUserCollection.creationTimestamp)}
          </div>
          <div>
            {firstUserCollection.protectedDatas?.length} protected{' '}
            {firstUserCollection.protectedDatas?.length > 1 ? 'datas' : 'data'}
          </div>
          <div>
            {firstUserCollection.subscriptions?.length}{' '}
            {firstUserCollection.subscriptions?.length > 1
              ? 'subscribers'
              : 'subscriber'}
          </div>
          {firstUserCollection.subscriptionParams ? (
            <>
              <div>
                Price in nRLC: {firstUserCollection.subscriptionParams.price}
              </div>
              <div>
                Duration in days:{' '}
                {readableSecondsToDays(
                  Number(firstUserCollection.subscriptionParams.duration)
                )}
              </div>
            </>
          ) : (
            <div className="mt-3 italic">
              This collection is not available for subscription, their owner has
              not set a price and duration yet.
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <Button
          disabled={
            collections?.length === 0 ||
            !firstUserCollection?.subscriptionParams ||
            subscribeMutation.isPending
          }
          onClick={() => {
            subscribeMutation.mutate();
          }}
        >
          {subscribeMutation.isPending && (
            <Loader size="16" className="mr-2 animate-spin-slow" />
          )}
          <span>Subscribe</span>
        </Button>

        {subscribeMutation.isError && (
          <Alert variant="error" className="mt-4">
            {subscribeMutation.error.toString()}
          </Alert>
        )}
      </div>

      {collections?.[1] && (
        <div className="mt-4 italic">
          User has other collections that are not displayed in this
          usecase-demo. (
          {collections
            .slice(1)
            .map((c) => c.id)
            .join(', ')}
          )
        </div>
      )}
    </div>
  );
}
