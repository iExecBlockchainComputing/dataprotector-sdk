import { FileRoute } from '@tanstack/react-router';

export const Route = new FileRoute('/_profile/rented-content').createRoute({
  component: RentedContent,
});

function RentedContent() {
  return (
    <>
      <div>My rented content</div>
      <div>TO DO</div>
    </>
  );
}
