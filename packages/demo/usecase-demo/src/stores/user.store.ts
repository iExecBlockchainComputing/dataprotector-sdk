import type { Address, Connector } from 'wagmi';
import { create } from 'zustand';

type UserState = {
  connector: Connector | undefined;
  setConnector: (param: Connector | undefined) => void;
  isConnected: boolean;
  setIsConnected: (param: boolean) => void;
  address: Address | undefined;
  setAddress: (param: Address | undefined) => void;
};

export const useUserStore = create<UserState>((set) => ({
  connector: undefined,
  setConnector: (connector: Connector | undefined) => set({ connector }),
  isConnected: false,
  setIsConnected: (isConnected: boolean) => set({ isConnected }),
  address: undefined,
  setAddress: (address: Address | undefined) => {
    set({ address: address?.toLowerCase() as Address });
  },
}));
