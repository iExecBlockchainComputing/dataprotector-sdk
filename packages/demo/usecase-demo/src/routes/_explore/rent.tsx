import { createFileRoute } from '@tanstack/react-router';
import { ActiveRentals } from '@/modules/ActiveRentals.tsx';
import { LatestContents } from '@/modules/home/latestContent/LatestContents.tsx';

export const Route = createFileRoute('/_explore/rent')({
  component: Rent,
});

function Rent() {
  return (
    <div>
      <h1 className="font-anybody text-2xl font-extrabold sm:text-4xl">
        Content you've rented
      </h1>

      <div className="mt-10 sm:mt-20">
        <ActiveRentals />
      </div>

      <div className="mt-10 sm:mt-20">
        <LatestContents isRentable={true} />
      </div>
    </div>
  );
}
