import { useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import {
  cleanDataProtectorSDK,
  initDataProtectorSDK,
} from '../externals/dataProtectorClient.ts';
import { useUserStore } from '../stores/user.store.ts';

export function useWatchWagmiAccount() {
  const { connector, isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const { setConnector, setIsConnected, setAddress } = useUserStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Update userStore
    setConnector(connector);
    setIsConnected(isConnected);
    setAddress(address);

    // Update dataProtector client
    if (connector) {
      initDataProtectorSDK({ connector });
      return;
    }
    cleanDataProtectorSDK();

    queryClient.removeQueries();
  }, [connector, isConnected, address, chain]);
}
