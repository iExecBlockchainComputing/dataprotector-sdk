import { createFileRoute, Outlet } from '@tanstack/react-router';
import { LeftNavBar } from '@/components/NavBar/LeftNavBar.tsx';
import LoginGuard from '../modules/profile/LoginGuard.tsx';

export const Route = createFileRoute('/_explore')({
  component: ExploreLayout,
});

function ExploreLayout() {
  return (
    <LoginGuard>
      <div className="mb-32 flex">
        <LeftNavBar />

        <div className="mt-10 w-full min-w-0 py-10 pl-5 pr-5 sm:pl-14">
          <Outlet />
        </div>
      </div>
    </LoginGuard>
  );
}
