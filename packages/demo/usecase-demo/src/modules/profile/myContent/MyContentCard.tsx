import { ProtectedDataInCollection } from '@iexec/dataprotector';
import { clsx } from 'clsx';
import { Link } from '@tanstack/react-router';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import styles from './MyContentCard.module.css';

export function MyContentCard({
  protectedData,
}: {
  protectedData: ProtectedDataInCollection;
}) {
  const cardVisualBg = Number(protectedData.id[protectedData.id.length - 1])
    ? 'card-visual-bg-1'
    : 'card-visual-bg-2';

  return (
    <div className="max-w-[343px] flex-1">
      <Link
        to={'/my-content/edit/$protectedDataAddress/recap'}
        params={{
          protectedDataAddress: protectedData.id,
        }}
        className="group relative mx-auto flex h-[193px] w-full items-center justify-center overflow-hidden rounded-t-xl transition-shadow hover:shadow-lg"
      >
        <div className={clsx(styles[cardVisualBg], 'h-full w-full')}>
          &nbsp;
        </div>
        {/*<div className="border-grey-50 absolute bottom-3 right-4 h-[34px] rounded-30 border px-3 py-2 text-xs">*/}
        {/*  Image*/}
        {/*</div>*/}
      </Link>
      <div className="max-w-full truncate rounded-b-xl border-b border-l border-r border-grey-700 px-4 pb-4 pt-4 text-sm">
        <div className="flex">
          <div className="mt-1 size-3 shrink-0 rounded-full bg-[#D9D9D9]">
            &nbsp;
          </div>
          <div className="ml-1.5 flex-1 truncate">
            <div className="text-grey-50 truncate">
              {!protectedData.name ? protectedData.id : protectedData.name}
            </div>
            <div className="mt-0.5 truncate text-grey-500">
              {truncateAddress(protectedData.id)}
            </div>
          </div>
          {protectedData.rentalParams && (
            <div className="-mt-0.5 pl-6 text-base font-bold text-primary">
              <div className="text-center">
                <div>{protectedData.rentalParams.price} nRLC</div>
                <div className="text-xs">
                  for{' '}
                  {readableSecondsToDays(protectedData.rentalParams.duration)}{' '}
                  days
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-end gap-x-2">
          {protectedData.isRentable && (
            <div className="border-grey-50 inline-flex h-[25px] items-center rounded-30 border px-2.5 text-[10px] text-xs">
              Rent
            </div>
          )}
          {protectedData.isIncludedInSubscription && (
            <div className="border-grey-50 inline-block h-[34px] rounded-30 border px-3 py-2 text-xs">
              Subscription
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
