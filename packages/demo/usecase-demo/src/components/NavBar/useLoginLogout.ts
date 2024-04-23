import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useDisconnect } from 'wagmi';
import { useContentStore } from '@/stores/content.store.ts';

// import { resetCompletedTaskIdsCache } from '@/utils/localStorageContentMap.ts';

export function useLoginLogout() {
  const { open } = useWeb3Modal();
  const { disconnectAsync } = useDisconnect();
  const { resetContent } = useContentStore();

  const logout = async () => {
    await disconnectAsync();
    resetContent();
    // resetCompletedTaskIdsCache();
  };

  const login = () => {
    open();
  };

  return {
    login,
    logout,
  };
}
