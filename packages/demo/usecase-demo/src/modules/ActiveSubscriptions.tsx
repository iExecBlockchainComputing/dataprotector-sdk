import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'react-feather';
import { activeSubscriptionsQuery } from '@/modules/activeSubscriptions.query.ts';
import { OneCreatorCard } from '@/modules/home/allCreators/OneCreatorCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { remainingDays } from '@/utils/remainingDays.ts';
import { MouseMove, OnScrollLeft, OnScrollRight } from '@/components/useCarouselLogic';

export function ActiveSubscriptions() {
  const { address } = useUserStore();
  const favoriteContentCreators = useRef(null);

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

  MouseMove(favoriteContentCreators)

  return (
    <div className="min-h-[214px] rounded-3xl bg-grey-800">
      {isError && (
        <div className="flex h-full min-h-[214px] items-center justify-center p-12">
          <span className="text-center text-xl">
            Oops, something went wrong while retrieving your subscriptions.
          </span>
        </div>
      )}

      {isSuccess && userSubscriptions.length === 0 && (
        <div className="flex h-full min-h-[214px] items-center justify-center p-12">
          <span className="text-xl font-extrabold">
            You haven't subscribed to anyone yet.
          </span>
        </div>
      )}

      {isSuccess && userSubscriptions.length > 0 && (
        <div className="flex flex-col p-12">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xl font-extrabold">
                Your favorite content creators ✨
              </div>
              <div className="mt-2">Find all your subscriptions</div>
            </div>
            {userSubscriptions?.length > 0 && (
              <div className='self-end'>
                <button
                  className="group p-1 transition-transform active:scale-[0.9]"
                  onClick={() => OnScrollLeft(favoriteContentCreators)}
                >
                  <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
                    <ArrowLeft size="18" />
                  </div>
                </button>
                <button
                  className="group ml-1 p-1 transition-transform active:scale-[0.9]"
                  onClick={() => OnScrollRight(favoriteContentCreators)}
                >
                  <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
                    <ArrowRight size="18" />
                  </div>
                </button>
              </div>
            )}
          </div>
          <div
            ref={favoriteContentCreators}
            className="mt-8 inline-flex max-w-full gap-x-4 pb-4 overflow-auto"
          >
            {userSubscriptions.map((subscription) => (
              <div key={subscription.id}>
                <OneCreatorCard
                  creator={subscription.collection.owner}
                  showSubscribedChip={true}
                  className="w-[251px]"
                />
                <div className="mt-2 px-2 text-sm italic text-grey-400">
                  Subscription ends in{' '}
                  {remainingDays({
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
