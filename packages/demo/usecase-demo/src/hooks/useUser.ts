import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';

export function useUser() {
  const { open } = useWeb3Modal();
  const { connector, isConnected, address } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const logout = async () => {
    await disconnectAsync();
  };

  const login = () => {
    open();
  };

  return {
    connector,
    isConnected,
    address: address?.toLowerCase(),
    login,
    logout,
  };
}
