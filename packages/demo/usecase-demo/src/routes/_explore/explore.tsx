import { createFileRoute } from '@tanstack/react-router';
import { AllCreators } from '@/modules/home/allCreators/AllCreators.tsx';
import { ContentOfTheWeek } from '@/modules/home/contentOfTheWeek/ContentOfTheWeek.tsx';

export const Route = createFileRoute('/_explore/explore')({
  component: Explore,
});

function Explore() {
  return (
    <div>
      <h1 className="font-anybody text-4xl font-extrabold">
        Unlock a world of creativity with Content Creator
      </h1>

      <div className="mt-20">
        <ContentOfTheWeek />
      </div>

      <div className="mt-20">
        <AllCreators />
      </div>
    </div>
  );
}
