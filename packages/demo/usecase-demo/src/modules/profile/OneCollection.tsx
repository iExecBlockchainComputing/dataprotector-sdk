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
      <SubscriptionParamsForm collection={collection} />
    </>
  );
}
