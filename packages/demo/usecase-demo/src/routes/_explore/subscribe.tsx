import { createFileRoute } from '@tanstack/react-router';
import { ActiveSubscriptions } from '@/modules/ActiveSubscriptions.tsx';
import { AllCreators } from '@/modules/home/allCreators/AllCreators.tsx';

export const Route = createFileRoute('/_explore/subscribe')({
  component: Subscribe,
});

function Subscribe() {
  return (
    <div>
      <h1 className="font-anybody text-4xl font-extrabold">
        Subscribe to stay ahead with your top creators
      </h1>

      <div className="mt-20">
        <ActiveSubscriptions />
      </div>

      <div className="mt-20">
        <AllCreators />
      </div>
    </div>
  );
}
