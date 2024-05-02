import { createFileRoute } from '@tanstack/react-router';
import { AllCreators } from '@/modules/home/allCreators/AllCreators.tsx';
import { LatestContents } from '@/modules/home/latestContent/LatestContents.tsx';

export const Route = createFileRoute('/_explore/explore')({
  component: Explore,
});

function Explore() {
  return (
    <div>
      <h1 className="font-anybody text-2xl font-extrabold sm:text-4xl">
        Unlock a world of creativity <br /> with Content Creator
      </h1>

      <div className="mt-10 sm:mt-20">
        <LatestContents />
      </div>

      <div className="mt-10 sm:mt-20">
        <AllCreators />
      </div>
    </div>
  );
}
