import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Check } from 'react-feather';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { activeSubscriptionsQuery } from '@/modules/activeSubscriptions.query.ts';
import { SubscribeButton } from '@/modules/subscribe/SubscribeButton.tsx';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { useUserStore } from '@/stores/user.store.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';
import { timestampToReadableDate } from '@/utils/timestampToReadableDate.ts';

export function CollectionInfoBlock({
  collection,
}: {
  collection: CollectionWithProtectedDatas;
}) {
  const userAddress = useUserStore((state) => state.address);

  const { isDevMode } = useDevModeStore();

  const countAvailableInSubscription = collection.protectedDatas?.filter(
    (protectedData) => protectedData.isIncludedInSubscription
  ).length;

  const allRentals = collection.protectedDatas?.reduce((sum, protectData) => {
    return sum + protectData.rentals.length;
  }, 0);

  const {
    data: hasActiveSubscription,
    isLoading: isActiveSubscriptionsLoading,
  } = useQuery({
    ...activeSubscriptionsQuery({ userAddress: userAddress! }),
    select: (userSubscriptions) => {
      return userSubscriptions.some(
        (subscription) =>
          subscription.collection.owner.id === collection.owner.id
      );
    },
  });

  return (
    <>
      <div className="rounded-2xl p-6 border-grey-700 border text-white flex gap-x-2">
        {collection.subscriptionParams && (
          <div className="flex-1 whitespace-nowrap flex flex-col items-center">
            <span className="text-2xl">
              {nrlcToRlc(collection.subscriptionParams.price)} RLC /{' '}
              {readableSecondsToDays(
                Number(collection.subscriptionParams.duration)
              )}
            </span>
            <span className="text-grey-400 text-xs">Subscription</span>
          </div>
        )}
        {!collection.subscriptionParams && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="flex-1 flex flex-col items-center">
                <span className="text-2xl">-</span>
                <span className="text-grey-400 text-xs">Subscription</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  <AlertCircle
                    size="16"
                    className="-mt-0.5 mr-0.5 inline-block"
                  />{' '}
                  The owner has not set a price and duration yet.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="ml-4 relative">
          <div className="absolute h-full top-0 left-1/2 w-px bg-grey-700">
            &nbsp;
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl">
            {collection.subscriptions?.length || 0}
          </span>
          <span className="text-grey-400 text-xs">
            {collection.subscriptions?.length > 1 ? 'Followers' : 'Follower'}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl">
            {collection.protectedDatas?.length || 0}
          </span>
          <span className="text-grey-400 text-xs text-center">
            {collection.protectedDatas?.length > 1
              ? 'Total contents'
              : 'Total content'}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl">{countAvailableInSubscription}</span>
          <span className="text-grey-400 text-xs text-center">
            {collection.protectedDatas?.length > 1 ? 'Contents' : 'Content'}{' '}
            available
            <br />
            with subscription
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <span className="text-2xl">{allRentals}</span>
          <span className="text-grey-400 text-xs">
            {allRentals > 1 ? 'Rentals' : 'Rental'}
          </span>
        </div>

        <div className="grow-0 flex items-center justify-end">
          {!isActiveSubscriptionsLoading && (
            <>
              {hasActiveSubscription && (
                <div className="rounded-30 flex items-center justify-center bg-grey-800 px-6 py-2.5 font-semibold">
                  Subscribed
                  <Check size="16" className="ml-1.5" />
                </div>
              )}
              {!hasActiveSubscription && (
                <SubscribeButton collection={collection} />
              )}
            </>
          )}
        </div>
      </div>

      {isDevMode && (
        <div className="mb-14 mt-3 rounded bg-grey-700 px-4 py-3 font-normal tracking-tight">
          <div>
            <span className="text-grey-400 italic">Collection no:</span>
            &nbsp;&nbsp;
            {collection.id}
          </div>
          <div>
            <span className="text-grey-400 italic">Created:</span>
            &nbsp;&nbsp;
            {timestampToReadableDate(collection.creationTimestamp)}
          </div>
        </div>
      )}
    </>
  );
}
