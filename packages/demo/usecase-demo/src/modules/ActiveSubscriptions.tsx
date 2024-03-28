import { useQuery } from '@tanstack/react-query';
import { activeSubscriptionsQuery } from '@/modules/activeSubscriptions.query.ts';
import { OneCreatorCard } from '@/modules/home/allCreators/OneCreatorCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { getRemainingDays } from '@/utils/getRemainingDays.ts';

export function ActiveSubscriptions() {
  const { address } = useUserStore();

  const {
    isSuccess,
    data: userSubscriptions,
    isError,
  } = useQuery({
    ...activeSubscriptionsQuery({ userAddress: address! }),
    select: (data) => {
      return data.map((subscription) => {
        return {
          ...subscription,
          collection: {
            ...subscription.collection,
            owner: {
              ...subscription.collection.owner,
              collections: [subscription.collection],
            },
          },
        };
      });
    },
  });

  return (
    <div className="min-h-[214px] rounded-3xl bg-grey-800 p-12">
      {isError && (
        <div className="flex items-center justify-center text-xl font-extrabold">
          Oops, something went wrong while retrieving your subscriptions.
        </div>
      )}

      {isSuccess && userSubscriptions.length === 0 && (
        <div className="flex items-center justify-center text-xl font-extrabold">
          You haven't subscribed to anyone yet.
        </div>
      )}

      {isSuccess && userSubscriptions.length > 0 && (
        <div className="flex flex-col">
          <div className="text-xl font-extrabold">
            Your favorite content creators ✨
          </div>
          <div className="mt-2">Find all your subscriptions</div>
          <div className="mt-8 grid w-full">
            {userSubscriptions.map((subscription) => (
              <div key={subscription.id}>
                <OneCreatorCard
                  creator={subscription.collection.owner}
                  showSubscribedChip={true}
                  className="w-[251px]"
                />
                <div className="mt-2 px-2 text-sm italic text-grey-400">
                  {getRemainingDays({
                    endDate: subscription.endDate,
                  })}{' '}
                  remaining days
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
