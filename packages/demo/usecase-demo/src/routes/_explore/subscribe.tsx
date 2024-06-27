import { createFileRoute } from '@tanstack/react-router';
import { ActiveSubscriptions } from '@/modules/ActiveSubscriptions.tsx';
import { AllCreators } from '@/modules/home/allCreators/AllCreators.tsx';

export const Route = createFileRoute('/_explore/subscribe')({
  component: Subscribe,
});

function Subscribe() {
  return (
    <div>
      <h1 className="font-anybody text-2xl font-extrabold sm:text-4xl">
        Subscribe to stay up to date with your favorite creators
      </h1>

      <div className="mt-10 sm:mt-20">
        <ActiveSubscriptions />
      </div>

      <div className="mt-10 sm:mt-20">
        <AllCreators />
      </div>
    </div>
  );
}
