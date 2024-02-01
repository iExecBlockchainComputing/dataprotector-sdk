import { create } from 'zustand';

type DevModeState = {
  isDevMode: boolean;
  setDevMode: (param: boolean) => void;
};

export const useDevModeStore = create<DevModeState>((set) => ({
  isDevMode: false,
  setDevMode: (devMode: boolean) => set({ isDevMode: devMode }),
}));
