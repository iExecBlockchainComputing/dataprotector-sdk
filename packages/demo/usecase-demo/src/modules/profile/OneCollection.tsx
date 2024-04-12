import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { DocLink } from '@/components/DocLink.tsx';
import { pluralize } from '@/utils/pluralize.ts';
import { timestampToReadableDate } from '@/utils/timestampToReadableDate.ts';
import { SubscriptionParamsForm } from './SubscriptionParamsForm.tsx';

export function OneCollection({
  collection,
}: {
  collection: CollectionWithProtectedDatas;
}) {
  return (
    <>
      <div className="mt-8">
        <div className="text-2xl font-semibold">Manage your subscription</div>
        <div className="mt-6">
          <SubscriptionParamsForm collection={collection} />
        </div>
      </div>

      <DocLink className="mb-14 mt-8">
        <div>
          <span className="italic text-grey-400">Collection ID:</span>
          &nbsp;{collection.id}
        </div>
        <div>
          <span className="italic text-grey-400">Created:</span>
          &nbsp;{timestampToReadableDate(collection.creationTimestamp)}
        </div>
        <div>
          {pluralize(collection.protectedDatas.length, 'protected data')}
        </div>
        <div>{pluralize(collection.subscriptions?.length, 'follower')}</div>
      </DocLink>
    </>
  );
}
