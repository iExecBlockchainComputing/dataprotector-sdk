import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useDisconnect } from 'wagmi';

export function useLoginLogout() {
  const { open } = useWeb3Modal();
  const { disconnectAsync } = useDisconnect();

  const logout = async () => {
    await disconnectAsync();
  };

  const login = () => {
    open();
  };

  return {
    login,
    logout,
  };
}
