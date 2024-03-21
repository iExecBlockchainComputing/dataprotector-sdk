import { truncateAddress } from '@/utils/truncateAddress.ts';
import { Link } from '@tanstack/react-router';
import styles from './OneCreatorCard.module.css';
import { clsx } from 'clsx';
import type { Address } from '@iexec/dataprotector';

export type OneCreator = {
  address: Address;
};

export function OneCreatorCard({ creator }: { creator: OneCreator }) {
  const cardVisualBg = Number(creator.address[creator.address.length - 1])
    ? 'card-visual-bg-1'
    : 'card-visual-bg-2';

  return (
    <>
      <Link
        to="/user/$userId"
        params={{
          userId: creator.address,
        }}
        className="group relative mx-auto flex h-[193px] w-full items-center justify-center overflow-hidden rounded-t-xl transition-shadow hover:shadow-lg"
      >
        <div className={clsx(styles[cardVisualBg], 'h-full w-full')}>
          &nbsp;
        </div>
      </Link>
      <div className="flex max-w-full truncate rounded-b-xl border-b border-l border-r border-grey-700 px-4 pb-6 pt-4 text-sm">
        <div className="mt-1 size-3 shrink-0 rounded-full bg-[#D9D9D9]">
          &nbsp;
        </div>
        <div className="ml-1.5 flex-1 truncate">
          {/*<div className="text-grey-50 truncate">*/}
          {/*  {!creator.name ? creator.address : creator.name}*/}
          {/*</div>*/}
          <div className="text-grey-50 truncate">
            {truncateAddress(creator.address)}
          </div>
          <div className="mt-0.5 truncate text-grey-500">
            Subscription 10 RLC
          </div>
        </div>
        {/*<div className="ml-3 shrink-0 text-right">*/}
        {/*  <div className="whitespace-nowrap font-bold text-primary">*/}
        {/*    0.01 RLC*/}
        {/*  </div>*/}
        {/*  <div className="mt-0.5 text-grey-500">Rent</div>*/}
        {/*</div>*/}
      </div>
    </>
  );
}
