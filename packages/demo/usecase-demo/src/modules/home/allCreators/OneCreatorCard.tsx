import { useUserStore } from '@/stores/user.store.ts';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import type { CollectionOwner } from '@iexec/dataprotector';
import { truncateAddress } from '@/utils/truncateAddress.ts';
import styles from './OneCreatorCard.module.css';

export function OneCreatorCard({ creator }: { creator: CollectionOwner }) {
  const userAddress = useUserStore((state) => state.address);

  const cardVisualBg = Number(creator.id[creator.id.length - 1])
    ? 'card-visual-bg-1'
    : 'card-visual-bg-2';

  const firstCollection = creator.collections[0];

  return (
    <>
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
      <div className="flex max-w-full truncate rounded-b-xl border-b border-l border-r border-grey-700 px-4 pb-6 pt-4 text-sm">
        <div className="mt-1 size-3 shrink-0 rounded-full bg-[#D9D9D9]">
          &nbsp;
        </div>
        <div className="ml-1.5 flex-1 truncate">
          <div className="text-grey-50 truncate">
            {truncateAddress(creator.id)}{' '}
            {userAddress === creator.id && (
              <span className="text-xs text-grey-400">(your account)</span>
            )}
          </div>
          {firstCollection?.subscriptionParams && (
            <div className="mt-0.5 truncate text-grey-500">
              Subscription {firstCollection.subscriptionParams.price} RLC
            </div>
          )}
        </div>
      </div>
    </>
  );
}
