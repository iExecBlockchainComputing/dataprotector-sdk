import { create } from 'zustand';

type DisclaimerModalState = {
  isDisclaimerModalOpen: boolean;
  isForceOpen: boolean;
  setDisclaimerModalOpen: (param: boolean) => void;
  openDisclaimerModalOpen: () => void;
};

export const useDisclaimerModalStore = create<DisclaimerModalState>((set) => ({
  isDisclaimerModalOpen: true,
  isForceOpen: false,
  setDisclaimerModalOpen: (disclaimerModal: boolean) =>
    set({ isDisclaimerModalOpen: disclaimerModal }),
  openDisclaimerModalOpen: () =>
    set({ isDisclaimerModalOpen: true, isForceOpen: true }),
}));
