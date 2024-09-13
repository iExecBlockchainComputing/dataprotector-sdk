import { useNavigate } from '@tanstack/react-router';
import { FC, ReactNode, useEffect } from 'react';
import { AlertCircle } from 'react-feather';
import { useSwitchChain, useAccount } from 'wagmi';
import { Button } from '@/components/ui/button.tsx';
import { useUserStore } from '@/stores/user.store.ts';

const LoginGuard: FC<{ children: ReactNode }> = ({ children }) => {
  const { isInitialized, isConnected } = useUserStore();
  const { chains, error, isPending, switchChain } = useSwitchChain();
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
      {isInitialized && isConnected && chain && chain.id !== 134 && (
        <div className="mx-auto my-12 ml-12">
          <p>Oops, you're on the wrong network</p>
          <p>Click on the following button to switch to the right network</p>
          <Button
            disabled={!isPending || chain?.id === chains[0]?.id}
            key={chains[0]?.id}
            onClick={() => switchChain({ chainId: chains[0]?.id })}
            className="mt-4"
          >
            Switch to {chains[0].name}
            {isPending && ' (switching)'}
          </Button>
          {error && (
            <div className="ml-1 mt-1.5 flex items-center text-red-500">
              <AlertCircle size="14" />
              <span className="ml-1 text-sm">{error.message}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default LoginGuard;
