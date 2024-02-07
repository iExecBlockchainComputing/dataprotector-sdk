import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { getDataProtectorClient } from '../externals/dataProtectorClient.ts';
import { getEnsForAddress } from '../externals/getEnsForAddress.ts';
import { useUserStore } from '../stores/user.store.ts';
import { timestampToReadableDate } from '../utils/timestampToReadableDate.ts';
import styles from './_profile.module.css';

export const Route = createFileRoute('/user/$userId')({
  component: UserProfile,
});

export function UserProfile() {
  const { userId } = Route.useParams();
  const [ensName, setEnsName] = useState();

  const { isConnected } = useUserStore();

  useEffect(() => {
    function getEns() {
      return getEnsForAddress(userId);
    }
    getEns().then((ens) => {
      ens && setEnsName(ens);
    });
  });

  const { isLoading, data: collections } = useQuery({
    queryKey: ['collections', userId],
    queryFn: async () => {
      const dataProtector = await getDataProtectorClient();
      return dataProtector.getCollectionsByOwner({
        ownerAddress: userId,
      });
    },
    enabled: isConnected,
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

      {collections?.[0] && (
        <div className="mt-3">
          <div>Collection {Number(collections[0].id)}</div>
          <div>
            Created: {timestampToReadableDate(collections[0].creationTimestamp)}
          </div>
          <div>{collections[0].protectedDatas?.length} protected data</div>
          <div>{collections[0].subscriptions?.length} subscribers</div>
          <div>Price in nRLC: {collections[0].subscriptionParams?.price}</div>
          <div>
            Duration in seconds: {collections[0].subscriptionParams?.duration}
          </div>
        </div>
      )}
    </div>
  );
}
