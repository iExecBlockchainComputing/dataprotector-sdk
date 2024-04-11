import { Outlet, createRootRoute, Navigate } from '@tanstack/react-router';
import { useWatchWagmiAccount } from '../utils/watchWagmiAccount.ts';

export const Route = createRootRoute({
  component: () => <RootComponent />,
  notFoundComponent: () => <Navigate to="/" />,
});

const RootComponent = () => {
  useWatchWagmiAccount();

  return <Outlet />;
};
