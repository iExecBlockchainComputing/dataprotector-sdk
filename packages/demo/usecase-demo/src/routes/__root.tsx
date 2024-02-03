import { Outlet, createRootRoute, Navigate } from '@tanstack/react-router';
import { NavBar } from '../components/NavBar/NavBar.tsx';
import { Footer } from '../components/Footer.tsx';
import { useWatchWagmiAccount } from '../utils/watchWagmiAccount.ts';

export const Route = createRootRoute({
  component: () => <RootComponent />,
  notFoundComponent: () => <Navigate to="/" />,
});

const RootComponent = () => {
  useWatchWagmiAccount();

  return (
    <>
      <NavBar />
      <div className="mt-12">
        <div className="relative z-10 mx-auto w-[93%] bg-background">
          <div className="mx-auto w-[84%] max-w-6xl">
            <Outlet />
            <hr className="mt-24" />
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};
