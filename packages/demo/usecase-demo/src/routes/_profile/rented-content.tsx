import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_profile/rented-content')({
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
