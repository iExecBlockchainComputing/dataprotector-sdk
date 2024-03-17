import type { OneCollectionByOwnerResponse } from '@iexec/dataprotector';
import { timestampToReadableDate } from '../../utils/timestampToReadableDate.ts';
import { SubscriptionParamsForm } from './SubscriptionParamsForm.tsx';

export function OneCollection({
  collection,
}: {
  collection: OneCollectionByOwnerResponse;
}) {
  return (
    <>
      <div>Collection 👉 {collection.id} 👈</div>
      <div>
        Created: {timestampToReadableDate(collection.creationTimestamp)}
      </div>
      <div>
        {collection.protectedDatas.length} protected{' '}
        {collection.protectedDatas.length > 1 ? 'datas' : 'data'}
      </div>
      <div>
        {collection.subscriptions?.length}{' '}
        {collection.protectedDatas.length > 1 ? 'subscribers' : 'subscriber'}
      </div>

      <div className="mt-8">
        <div>Define new subscription parameters:</div>
        <div className="mb-4 mt-0.5 text-xs">
          (will apply only to new subscribers)
        </div>
        <SubscriptionParamsForm collection={collection} />
      </div>
    </>
  );
}
