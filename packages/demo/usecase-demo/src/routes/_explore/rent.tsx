import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_explore/rent')({
  component: Rent,
});

function Rent() {
  return (
    <div>
      <h1 className="font-anybody text-4xl font-extrabold">
        Find here all your rented contents
      </h1>
    </div>
  );
}
