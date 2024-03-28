import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { AlertCircle, Check } from 'react-feather';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { useDevModeStore } from '@/stores/devMode.store.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';
import { timestampToReadableDate } from '@/utils/timestampToReadableDate.ts';

export function CollectionInfoBlock({
  collection,
}: {
  collection: CollectionWithProtectedDatas;
}) {
  const { isDevMode } = useDevModeStore();

  const countAvailableInSubscription = collection.protectedDatas?.filter(
    (protectedData) => protectedData.isIncludedInSubscription
  ).length;

  const allRentals = collection.protectedDatas?.reduce((sum, protectData) => {
    return sum + protectData.rentals.length;
  }, 0);

  return (
    <>
      <div className="rounded-2xl p-6 border-grey-700 border text-white flex">
        {collection.subscriptionParams && (
          <div className="flex-1 whitespace-nowrap flex flex-col items-center">
            <span className="text-2xl">
              {nrlcToRlc(collection.subscriptionParams.price)} RLC /{' '}
              {readableSecondsToDays(
                Number(collection.subscriptionParams.duration)
              )}{' '}
              days
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

        <div className="ml-9 border border-transparent border-r-grey-700">
          &nbsp;
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
          <span className="text-grey-400 text-xs">
            Total{' '}
            {collection.protectedDatas?.length > 1 ? 'contents' : 'content'}
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
          <div className="rounded-30 flex items-center justify-center bg-grey-800 px-6 py-2.5 font-semibold">
            Subscribed
            <Check size="16" className="ml-1.5" />
          </div>
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
