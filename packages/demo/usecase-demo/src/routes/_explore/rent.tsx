import { createFileRoute } from '@tanstack/react-router';
import { ActiveRentals } from '@/modules/ActiveRentals.tsx';
import { ContentOfTheWeek } from '@/modules/home/contentOfTheWeek/ContentOfTheWeek.tsx';

export const Route = createFileRoute('/_explore/rent')({
  component: Rent,
});

function Rent() {
  return (
    <div>
      <h1 className="font-anybody text-4xl font-extrabold">
        Find here all your rented contents
      </h1>

      <div className="mt-20">
        <ActiveRentals />
      </div>

      <div className="mt-20">
        <ContentOfTheWeek isRentable={true} />
      </div>
    </div>
  );
}
