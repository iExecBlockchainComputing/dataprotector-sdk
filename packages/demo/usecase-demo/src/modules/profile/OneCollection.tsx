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

      <DocLink className="mt-8">
        <div>
          <span className="italic text-grey-400">Collection ID:</span>
          &nbsp;{Number(collection.id)}
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
      <DocLink className="mb-14 mt-6 w-full">
        dataprotector-sdk / Method called:{' '}
        <a
          href="https://beta.tools.docs.iex.ec/tools/dataProtector/dataProtectorSharing/subscription/setSubscriptionParams.html"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          <br />
          setSubscriptionParams({'{'}
          <br />
          &nbsp;&nbsp;collectionId: {collection.id},
          <br />
          &nbsp;&nbsp;price: 2, // 2 nRLC,
          <br />
          &nbsp;&nbsp;duration: 60 * 60 * 24 * 30, // 30 days,
          <br />
          {'}'});
        </a>
      </DocLink>
    </>
  );
}
