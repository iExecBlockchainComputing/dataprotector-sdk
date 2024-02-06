import { useNavigate } from '@tanstack/react-router';
import { FC, ReactNode, useEffect } from 'react';
import { AlertCircle } from 'react-feather';
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { Button } from '@/components/ui/button.tsx';

const LoginGuard: FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { chains, error, isLoading, pendingChainId, switchNetwork } =
    useSwitchNetwork();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected && (chain?.id !== 134 || chain)) {
      navigate({ to: '/' });
    }
  }, [isConnected, chain]);

  return (
    <>
      {isConnected && chain?.id === 134 && <>{children}</>}
      {isConnected && chain?.id !== 134 && (
        <div className="mx-auto my-12">
          <p>Oops, you're on the wrong network</p>
          <p>Click on the following button to switch to the right network</p>
          <Button
            disabled={!switchNetwork || chain?.id === chains[0]?.id}
            key={chains[0]?.id}
            onClick={() => switchNetwork?.(chains[0]?.id)}
            className="mt-4"
          >
            Switch to {chains[0].name}
            {isLoading && pendingChainId === chains[0]?.id && ' (switching)'}
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
