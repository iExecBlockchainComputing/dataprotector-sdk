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
        <div className="relative z-10 mx-auto w-[93%] bg-background">
          <div className="mx-auto w-[84%] max-w-6xl pb-24">
            <Outlet />
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
