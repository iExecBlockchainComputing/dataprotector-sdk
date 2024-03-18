import { AllCreators } from '@/modules/home/allCreators/AllCreators.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_explore/subscribe')({
  component: Subscribe,
});

function Subscribe() {
  return (
    <div>
      <h1 className="font-anybody text-4xl font-extrabold">
        Subscribe to stay ahead with your top creators
      </h1>

      <div className="mt-20 flex h-[214px] items-center justify-center rounded-3xl bg-grey-800 text-xl font-extrabold">
        You haven't subscribed to anyone yet.
      </div>

      <div className="mt-20">
        <AllCreators />
      </div>
    </div>
  );
}
