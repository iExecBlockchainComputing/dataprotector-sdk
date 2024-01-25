import { FileRoute, Outlet } from '@tanstack/react-router';

export const Route = new FileRoute('/my-content').createRoute({
  component: MyContent,
});

function MyContent() {
  return <Outlet />;
}
