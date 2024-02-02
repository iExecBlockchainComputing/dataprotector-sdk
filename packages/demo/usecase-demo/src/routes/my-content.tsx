import { FileRoute, Outlet } from '@tanstack/react-router';

/**
 * To be removed
 */

export const Route = new FileRoute('/my-content').createRoute({
  component: MyContent,
});

function MyContent() {
  return <Outlet />;
}
