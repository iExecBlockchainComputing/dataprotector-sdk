import { createFileRoute, Outlet } from '@tanstack/react-router';

/**
 * To be removed
 */

export const Route = createFileRoute('/my-content')({
  component: MyContent,
});

function MyContent() {
  return <Outlet />;
}
