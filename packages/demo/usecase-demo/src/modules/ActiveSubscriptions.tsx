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
    <div className="rounded-3xl bg-grey-800">
      {isError && (
        <div className="h-full flex justify-center items-center min-h-[214px] p-12">
          <span className="text-xl text-center">
            Oops, something went wrong while retrieving your subscriptions.
          </span>
        </div>
      )}

      {isSuccess && userSubscriptions.length === 0 && (
        <div className="h-full flex justify-center items-center min-h-[214px] p-12">
          <span className="text-xl font-extrabold">
            You haven't subscribed to anyone yet.
          </span>
        </div>
      )}

      {isSuccess && userSubscriptions.length > 0 && (
        <div className="flex flex-col p-12">
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
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
