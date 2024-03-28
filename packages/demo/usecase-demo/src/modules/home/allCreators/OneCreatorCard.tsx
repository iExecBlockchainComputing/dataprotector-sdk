import type { CollectionOwner } from '@iexec/dataprotector';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { Check } from 'react-feather';
import { useUserStore } from '@/stores/user.store.ts';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import styles from './OneCreatorCard.module.css';

export function OneCreatorCard({
  creator,
  className,
  showSubscribedChip,
}: {
  creator: CollectionOwner;
  className?: string;
  showSubscribedChip?: true;
}) {
  const userAddress = useUserStore((state) => state.address);

  const cardVisualBg = Number(creator.id[creator.id.length - 1])
    ? 'card-visual-bg-1'
    : 'card-visual-bg-2';

  const firstCollection = creator.collections[0];

  return (
    <div className={className}>
      <Link
        to="/user/$profileAddress"
        params={{
          profileAddress: creator.id,
        }}
        className="group relative mx-auto flex h-[193px] w-full items-center justify-center overflow-hidden rounded-t-xl transition-shadow hover:shadow-lg"
      >
        <div className={clsx(styles[cardVisualBg], 'h-full w-full')}>
          &nbsp;
        </div>
      </Link>
      <div className="max-w-full rounded-b-xl border-b border-l border-r border-grey-700 bg-grey-900 px-6 py-6">
        <div className="flex">
          <div className="mt-1 size-4 shrink-0 rounded-full bg-[#D9D9D9]">
            &nbsp;
          </div>
          <div className="text-grey-50 ml-2">
            {truncateAddress(creator.id)}{' '}
            {userAddress === creator.id && (
              <span className="text-xs text-grey-400">(your account)</span>
            )}
          </div>
        </div>
        {firstCollection?.subscriptionParams && (
          <div className="mt-1 font-bold text-grey-500">
            Subscription {firstCollection.subscriptionParams.price} RLC
          </div>
        )}
        {showSubscribedChip && (
          <div className="mt-4 inline-flex w-full items-center justify-center rounded-30 bg-grey-800 px-6 py-2.5 font-semibold">
            Subscribed
            <Check size="16" className="ml-1.5" />
          </div>
        )}
      </div>
    </div>
  );
}
