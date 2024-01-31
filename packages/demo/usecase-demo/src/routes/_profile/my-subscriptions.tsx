import { FileRoute } from '@tanstack/react-router';

export const Route = new FileRoute('/_profile/my-subscriptions').createRoute({
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
