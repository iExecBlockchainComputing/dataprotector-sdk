import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_profile/my-subscriptions')({
  component: MySubscriptions,
});

function MySubscriptions() {
  return (
    <>
      <div>My subscriptions</div>
      <div>TO DO</div>
    </>
  );
}
