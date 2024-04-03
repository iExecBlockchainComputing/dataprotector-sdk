import { ProtectedDataInCollection } from '@iexec/dataprotector';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { getCardVisualNumber } from '@/utils/getCardVisualNumber.ts';
import { nrlcToRlc } from '@/utils/nrlcToRlc.ts';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import styles from './OneContentCard.module.css';

export function OneContentCard({
  protectedData,
  linkToDetails,
  className,
}: {
  protectedData: ProtectedDataInCollection;
  linkToDetails: string;
  className?: string;
}) {
  const cardVisualBg = getCardVisualNumber({
    address: protectedData.id,
  });

  return (
    <div className={className}>
      <Link
        to={linkToDetails}
        params={{
          protectedDataAddress: protectedData.id,
        }}
        className="group relative mx-auto flex h-[193px] w-full items-center justify-center overflow-hidden rounded-t-xl transition-shadow hover:shadow-lg"
      >
        <div
          className={clsx(
            styles[cardVisualBg],
            'h-full w-full bg-cover bg-bottom'
          )}
        >
          &nbsp;
        </div>
        {/*<div className="border-grey-50 absolute bottom-3 right-4 h-[34px] rounded-30 border px-3 py-2 text-xs">*/}
        {/*  Image*/}
        {/*</div>*/}
      </Link>
      <div className="bg-grey-900 max-w-full truncate rounded-b-xl border-b border-l border-r border-grey-700 px-4 pb-4 pt-4 text-sm">
        <div className="flex">
          <div className="mt-1 size-3 shrink-0 rounded-full bg-[#D9D9D9]">
            &nbsp;
          </div>
          <div className="ml-1.5 flex-1 truncate">
            <div className="text-grey-50 truncate">
              {!protectedData.name ? protectedData.id : protectedData.name}
            </div>
            <div className="mt-0.5 truncate text-grey-500 group">
              <span className="inline group-hover:hidden">
                {truncateAddress(protectedData.id)}
              </span>
              <span className="hidden group-hover:inline text-xs">
                {protectedData.id}
              </span>
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
          {protectedData.saleParams && (
            <div className="-mt-0.5 pl-6 text-base font-bold text-primary">
              <div className="text-center">
                <div>{nrlcToRlc(protectedData.saleParams.price)} RLC</div>
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
            <div className="border-grey-50 inline-flex h-[25px] items-center rounded-30 border px-2.5 text-[10px] text-xs">
              Subscription
            </div>
          )}
          {protectedData.isForSale && (
            <div className="border-grey-50 inline-flex h-[25px] items-center rounded-30 border px-2.5 text-[10px] text-xs">
              Sale
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
