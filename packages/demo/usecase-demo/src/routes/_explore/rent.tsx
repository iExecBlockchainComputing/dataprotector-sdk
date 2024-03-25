import { ContentOfTheWeek } from '@/modules/home/contentOfTheWeek/ContentOfTheWeek.tsx';
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

      <div className="mt-20 flex h-[214px] items-center justify-center rounded-3xl bg-grey-800 text-xl font-extrabold">
        You haven't rented anything yet.
      </div>

      <div className="mt-20">
        <ContentOfTheWeek isRentable={true} />
      </div>
    </div>
  );
}
