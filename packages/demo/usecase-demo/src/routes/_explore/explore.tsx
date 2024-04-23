import { createFileRoute } from '@tanstack/react-router';
import { AllCreators } from '@/modules/home/allCreators/AllCreators.tsx';
import { LatestContents } from '@/modules/home/latestContent/LatestContents.tsx';

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
        <LatestContents />
      </div>

      <div className="mt-20">
        <AllCreators />
      </div>
    </div>
  );
}
