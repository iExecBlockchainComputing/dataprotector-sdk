import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Footer } from '@/components/Footer.tsx';
import { LeftNavBar } from '@/components/NavBar/LeftNavBar';
import { NavBar } from '@/components/NavBar/NavBar.tsx';
import { useUserStore } from '@/stores/user.store';

export const Route = createFileRoute('/_index')({
  component: HomeLayout,
});

function HomeLayout() {
  const { isConnected } = useUserStore();

  return (
    <>
      {!isConnected ? (
        <NavBar />
      ) : (
        <>
          <NavBar className="hidden md:flex" />
          <LeftNavBar className="md:hidden" />
        </>
      )}
      <div className="pt-12">
        <div className="relative z-10 mx-auto bg-background px-6 sm:px-12">
          <div className="mx-auto max-w-7xl pb-32">
            <Outlet />
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
