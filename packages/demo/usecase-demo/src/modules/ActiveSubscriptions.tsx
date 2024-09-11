import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { CarouselScrollArrows } from '@/components/CarouselScrollArrows.tsx';
import { DocLink } from '@/components/DocLink';
import { activeSubscriptionsQuery } from '@/modules/activeSubscriptions.query.ts';
import { OneCreatorCard } from '@/modules/home/allCreators/OneCreatorCard.tsx';
import { useUserStore } from '@/stores/user.store.ts';
import { remainingDays } from '@/utils/remainingDays.ts';

export function ActiveSubscriptions() {
  const { address } = useUserStore();
  const favoriteContentCreators = useRef<HTMLDivElement>(null);

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
        <div className="flex flex-col p-6 sm:p-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold">
                Your favorite content creators ✨
              </div>
              <div className="mt-2">Find all your subscriptions</div>
            </div>
            {userSubscriptions?.length > 0 && (
              <CarouselScrollArrows carousel={favoriteContentCreators} />
            )}
          </div>
          <div
            ref={favoriteContentCreators}
            className="mt-8 inline-flex max-w-full gap-x-4 overflow-auto pb-4"
          >
            {userSubscriptions.map((subscription) => (
              <div key={subscription.id} className="flex flex-col">
                <OneCreatorCard
                  creator={subscription.collection.owner}
                  showSubscribedChip={true}
                  className="w-[300px]"
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

      {isSuccess && (
        <div className="-mt-4 pb-6">
          <DocLink className="mx-6">
            dataprotector-sdk / Method called:{' '}
            <a
              href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/misc/getCollectionSubscriptions.html"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              <br />
              getCollectionSubscriptions({'{'}
              <br />
              &nbsp;&nbsp;subscriberAddress: "{address}",
              <br />
              &nbsp;&nbsp;includePastSubscriptions: false,
              <br />
              {'}'})
            </a>
          </DocLink>
        </div>
      )}
    </div>
  );
}
