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
    </div>
  );
}
