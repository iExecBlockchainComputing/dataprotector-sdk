import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Check } from 'react-feather';
import { DocLink } from '@/components/DocLink.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { activeSubscriptionsQuery } from '@/modules/activeSubscriptions.query.ts';
import { SubscribeButton } from '@/modules/subscribe/SubscribeButton.tsx';
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
      <div className="ld:gap-6 grid gap-x-2 gap-y-6 rounded-2xl border border-grey-700 p-6 text-white md:flex md:justify-evenly">
        {collection.subscriptionParams && (
          <div className="mx-auto flex w-1/5 flex-col items-center whitespace-nowrap">
            <span className="text-2xl">
              {nrlcToRlc(collection.subscriptionParams.price)} RLC /{' '}
              {readableSecondsToDays(
                Number(collection.subscriptionParams.duration)
              )}
            </span>
            <span className="text-xs text-grey-400">Subscription</span>
          </div>
        )}
        {!collection.subscriptionParams && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="flex flex-col items-center justify-center md:w-1/5">
                <span className="text-2xl">-</span>
                <span className="text-xs text-grey-400">Subscription</span>
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

        <div className="relative md:ml-4">
          <div className="absolute top-1/2 h-px w-full bg-grey-700 md:left-1/2 md:top-0 md:h-full md:w-px">
            &nbsp;
          </div>
        </div>

        <div className="grid w-full grid-cols-2 justify-evenly gap-2 lg:flex">
          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl">
              {collection.subscriptions?.length || 0}
            </span>
            <span className="text-xs text-grey-400">
              {collection.subscriptions?.length > 1 ? 'Followers' : 'Follower'}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl">
              {collection.protectedDatas?.length || 0}
            </span>
            <span className="text-center text-xs text-grey-400">
              {collection.protectedDatas?.length > 1
                ? 'Total content'
                : 'Total content'}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl">{countAvailableInSubscription}</span>
            <span className="text-center text-xs text-grey-400">
              {collection.protectedDatas?.length > 1 ? 'Contents' : 'Content'}{' '}
              available
              <br />
              with subscription
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl">{allRentals}</span>
            <span className="text-xs text-grey-400">
              {allRentals > 1 ? 'Rentals' : 'Rental'}
            </span>
          </div>
        </div>

        <div className="grid grow-0 items-center md:flex md:justify-end">
          {!isActiveSubscriptionsLoading && (
            <>
              {hasActiveSubscription && (
                <div className="flex items-center justify-center rounded-30 bg-grey-800 px-6 py-2.5 font-semibold">
                  Subscribed
                  <Check size="16" className="-mr-1 ml-2.5" />
                </div>
              )}
              {!hasActiveSubscription && collection.subscriptionParams && (
                <SubscribeButton collection={collection} />
              )}
              {!collection.subscriptionParams && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger className="flex flex-1 flex-col items-center">
                      <span className="inline-flex h-11 w-full items-center justify-center rounded-30 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground opacity-50 ring-offset-background transition-colors duration-300 ease-out dark:hover:bg-grey-100">
                        Subscribe
                      </span>
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
            </>
          )}
        </div>
      </div>

      <DocLink className="mt-3 rounded bg-grey-700 px-4 py-3 font-normal tracking-tight">
        <div>
          <span className="italic text-grey-400">Collection ID:</span>
          &nbsp;
          {Number(collection.id)}
        </div>
        <div>
          <span className="italic text-grey-400">Created:</span>
          &nbsp;
          {timestampToReadableDate(collection.creationTimestamp)}
        </div>
      </DocLink>
    </>
  );
}
