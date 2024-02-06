import type { OneCollectionByOwnerResponse } from '@iexec/dataprotector';
import { timestampToReadableDate } from '../../utils/timestampToReadableDate.ts';
import { SubscriptionOptionsForm } from './SubscriptionOptionsForm.tsx';

export function OneCollection({
  collection,
}: {
  collection: OneCollectionByOwnerResponse;
}) {
  return (
    <>
      <div>Collection 👉 {Number(collection.id)} 👈</div>
      <div>
        Created: {timestampToReadableDate(collection.creationTimestamp)}
      </div>
      <div>
        {collection.protectedDatas.length} protected{' '}
        {collection.protectedDatas.length > 1 ? 'datas' : 'data'}
      </div>
      <SubscriptionOptionsForm collection={collection} />
    </>
  );
}
