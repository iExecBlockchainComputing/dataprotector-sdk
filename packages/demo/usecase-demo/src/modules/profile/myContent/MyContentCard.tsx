import { truncateAddress } from '@/utils/truncateAddress.ts';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import styles from './MyContentCard.module.css';

export type OneProtectedData = {
  // address: Address;
  // address: AddressOrENS;
  address: string;
  name: string;
  creationTimestamp: number;
  isRentable: boolean;
  isForSale: boolean;
  isIncludedInSubscription: boolean;
};

export function MyContentCard({
  protectedData,
}: {
  protectedData: OneProtectedData;
}) {
  const cardVisualBg = Number(
    protectedData.address[protectedData.address.length - 1]
  )
    ? 'card-visual-bg-1'
    : 'card-visual-bg-2';

  return (
    <div className="max-w-[343px]">
      <Link
        to={'/my-content/new/$protectedDataAddress/recap'}
        params={{
          protectedDataAddress: protectedData.address,
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
              {!protectedData.name ? protectedData.address : protectedData.name}
            </div>
            <div className="mt-0.5 truncate text-grey-500">
              {truncateAddress(protectedData.address)}
            </div>
          </div>
          {/*<div className="ml-3 shrink-0 text-right">*/}
          {/*  <div className="whitespace-nowrap font-bold text-primary">*/}
          {/*    0.01 RLC*/}
          {/*  </div>*/}
          {/*</div>*/}
        </div>
        <div className="mt-2 flex justify-end gap-x-2">
          {protectedData.isRentable && (
            <div className="border-grey-50 inline-block h-[34px] rounded-30 border px-3 py-2 text-xs">
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
