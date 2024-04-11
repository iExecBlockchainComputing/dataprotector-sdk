import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import {
  cleanDataProtectorSDK,
  initDataProtectorSDK,
} from '../externals/dataProtectorClient.ts';
import { useUserStore } from '../stores/user.store.ts';

export function useWatchWagmiAccount() {
  const { connector, isConnected, address, status } = useAccount();
  const { chain } = useNetwork();
  const { setConnector, setInitialized, setConnected, setAddress } =
    useUserStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Update userStore
    setConnector(connector);
    setInitialized(status === 'connected' || status === 'disconnected');
    setConnected(isConnected);
    setAddress(address);

    // Update dataProtector client
    if (connector) {
      initDataProtectorSDK({ connector });
      return;
    }
    cleanDataProtectorSDK();

    queryClient.removeQueries();
  }, [connector, status, isConnected, address, chain]);
}
