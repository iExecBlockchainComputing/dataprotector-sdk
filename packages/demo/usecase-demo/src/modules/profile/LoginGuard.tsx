import { useNavigate } from '@tanstack/react-router';
import { FC, ReactNode, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserStore } from '@/stores/user.store.ts';

const LoginGuard: FC<{ children: ReactNode }> = ({ children }) => {
  const { isInitialized, isConnected } = useUserStore();
  const { chain } = useAccount();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isConnected && (chain?.id !== 134 || chain)) {
      navigate({ to: '/' });
    }
  }, [isInitialized, isConnected, chain]);

  return (
    <>
      {isInitialized && isConnected && chain && chain.id === 134 && (
        <>{children}</>
      )}
    </>
  );
};

export default LoginGuard;
