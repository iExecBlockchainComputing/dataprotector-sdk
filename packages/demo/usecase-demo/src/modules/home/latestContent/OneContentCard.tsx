import { ProtectedDataInCollection } from '@iexec/dataprotector';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { Lock } from 'react-feather';
import { useUserStore } from '@/stores/user.store.ts';
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';
import { cn } from '@/utils/style.utils.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import styles from './OneContentCard.module.css';
import { OneContentCardLoginModal } from './OneContentCardLoginModal';

export function OneContentCard({
  protectedData,
  linkToDetails,
  className,
  showLockIcon = true,
}: {
  protectedData: ProtectedDataInCollection;
  linkToDetails?: string;
  className?: string;
  showLockIcon?: boolean;
}) {
  const cardVisualBg = getCardVisualNumber({
    address: protectedData.id,
  });

  const isConnected = useUserStore((state) => state.isConnected);

  return (
    <div className={cn(className, 'flex grow flex-col')}>
      {!isConnected ? (
        <OneContentCardLoginModal protectedDataAddress={protectedData.id} />
      ) : (
        <Link
          to={linkToDetails}
          params={{
            protectedDataAddress: protectedData.id,
          }}
          className={cn(
            'group relative mx-auto flex aspect-[2/1] w-full flex-none items-center justify-center overflow-hidden rounded-t-3xl transition-shadow hover:shadow-lg',
            !linkToDetails && 'cursor-default'
          )}
        >
          <div
            className={clsx(
              styles[cardVisualBg],
              'flex h-full w-full items-center justify-center bg-cover bg-bottom'
            )}
          >
            &nbsp;
            {showLockIcon && (
              <Lock
                size="30"
                className="absolute text-grey-50 opacity-100 duration-200 group-hover:opacity-50"
              />
            )}
          </div>
        </Link>
      )}
      <div className="max-w-full grow truncate rounded-b-3xl border-x border-b border-grey-700 bg-grey-900 px-4 py-4 text-sm">
        <div className="flex">
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-grey-50">
              {!protectedData.name ? protectedData.id : protectedData.name}
            </div>
            <div className="group mt-0.5 inline-block w-full truncate text-grey-500">
              <span className="inline group-hover:hidden">
                {truncateAddress(protectedData.id)}
              </span>
              <span className="hidden text-xs group-hover:inline">
                {protectedData.id}
              </span>
            </div>
          </div>
          {protectedData.rentalParams && (
            <div className="-mt-0.5 pl-6 text-base font-bold text-primary">
              <div className="text-center">
                <div>{nrlcToRlc(protectedData.rentalParams.price)} RLC</div>
                <div className="text-xs">
                  for{' '}
                  {readableSecondsToDays(protectedData.rentalParams.duration)}{' '}
                </div>
              </div>
            </div>
          )}
          {protectedData.saleParams && (
            <div className="-mt-0.5 pl-6 text-base font-bold text-primary">
              <div className="text-center">
                <div>{nrlcToRlc(protectedData.saleParams.price)} RLC</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-x-2">
          {protectedData.isRentable && (
            <div className="mt-1 inline-flex h-[25px] items-center rounded-30 border border-grey-50 px-2.5 text-[10px] text-xs">
              Rent
            </div>
          )}
          {protectedData.isIncludedInSubscription && (
            <div className="mt-1 inline-flex h-[25px] items-center rounded-30 border border-grey-50 px-2.5 text-[10px] text-xs">
              Subscription
            </div>
          )}
          {protectedData.isForSale && (
            <div className="mt-1 inline-flex h-[25px] items-center rounded-30 border border-grey-50 px-2.5 text-[10px] text-xs">
              Sale
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
