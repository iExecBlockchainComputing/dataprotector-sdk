import { SubscriptionOptionsForm } from './SubscriptionOptionsForm.tsx';

export function OneCollection({
  collectionId,
  protectedDatasCount,
}: {
  collectionId: number;
  protectedDatasCount: number;
}) {
  return (
    <>
      <div>Collection 👉 {collectionId} 👈</div>
      <div className="mt-1">
        {protectedDatasCount} protected{' '}
        {protectedDatasCount > 1 ? 'datas' : 'data'}
      </div>
      <SubscriptionOptionsForm collectionId={collectionId} />
    </>
  );
}
