import { useToast } from '@/components/ui/use-toast.ts';
import { OneContentCard } from '@/modules/home/contentOfTheWeek/OneContentCard.tsx';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Loader } from 'react-feather';
import { Alert } from '../../components/Alert.tsx';
import { Button } from '../../components/ui/button.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { getEnsForAddress } from '@/externals/getEnsForAddress.ts';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';
import { timestampToReadableDate } from '@/utils/timestampToReadableDate.ts';
import styles from './_profile.module.css';

export const Route = createFileRoute('/_explore/user/$userAddress')({
  component: UserProfile,
});

export function UserProfile() {
  const { userAddress } = Route.useParams();

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const [ensName, setEnsName] = useState();

  const displayAddress = truncateAddress(userAddress);

  useEffect(() => {
    function getEns() {
      return getEnsForAddress(userAddress);
    }
    getEns().then((ens) => {
      ens && setEnsName(ens);
    });
  }, []);

  const { isLoading, isSuccess, data, isError, error } = useQuery({
    queryKey: ['collections', userAddress],
    queryFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.getCollectionsByOwner({
        ownerAddress: userAddress,
      });
    },
  });

  const firstUserCollection = data?.collections?.[0];

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!firstUserCollection) {
        return;
      }
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.subscribeToCollection({
        collectionTokenId: firstUserCollection.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections', userAddress] });
      toast({
        variant: 'success',
        title: 'Subscription added',
      });
    },
  });

  return (
    <div className="-mt-20">
      <div
        className={clsx(
          styles['profile-banner'],
          'profile-banner relative mb-[95px] h-[228px] w-full rounded-3xl'
        )}
      >
        <div className="absolute -bottom-[40px] left-0 size-[118px] rounded-full border-[5px] border-[#D9D9D9] bg-black"></div>
        <div className="absolute -bottom-[32px] left-[136px] font-inter text-white">
          {displayAddress}
        </div>
      </div>

      {ensName && <div>{ensName}</div>}

      {isLoading && <div className="mt-3">Loading...</div>}

      {isError && (
        <Alert variant="error" className="mt-4">
          <p>
            Oops, something went wrong while fetching this user's collection.
          </p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && !firstUserCollection && (
        <div className="mt-3 italic">No collection found for this user</div>
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

      {isSuccess && data.collections?.[1] && (
        <div className="mt-4 italic">
          User has other collections that are not displayed in this
          usecase-demo. (
          {data.collections
            .slice(1)
            .map((c) => c.id)
            .join(', ')}
          )
        </div>
      )}

      {isSuccess && firstUserCollection?.protectedDatas?.length > 0 && (
        <div className="mt-8">
          {firstUserCollection?.protectedDatas.map((protectData) => (
            <div key={protectData.address} className="w-[400px] shrink-0">
              <OneContentCard protectedData={protectData} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
