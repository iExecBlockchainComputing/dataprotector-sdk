import { createFileRoute, Outlet } from '@tanstack/react-router';
import { Footer } from '@/components/Footer.tsx';
import { NavBar } from '@/components/NavBar/NavBar.tsx';

export const Route = createFileRoute('/_index')({
  component: HomeLayout,
});

function HomeLayout() {
  return (
    <>
      <NavBar />
      <div className="mt-12">
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
