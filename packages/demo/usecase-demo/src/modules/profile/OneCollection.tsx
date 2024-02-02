import { SubscriptionOptionsForm } from './SubscriptionOptionsForm.tsx';

export function OneCollection({ collectionId }: { collectionId: number }) {
  return (
    <>
      <div>Collection 👉 {collectionId} 👈</div>
      <SubscriptionOptionsForm collectionId={collectionId} />
    </>
  );
}
