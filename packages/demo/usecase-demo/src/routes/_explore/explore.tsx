import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_explore/explore')({
  component: Explore,
});

function Explore() {
  return (
    <div>
      <h1 className="font-anybody text-4xl font-extrabold">
        Unlock a world of creativity with Content Creator
      </h1>
    </div>
  );
}
