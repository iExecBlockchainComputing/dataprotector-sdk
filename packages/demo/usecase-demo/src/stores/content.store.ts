import { create } from 'zustand';

/**
 * In-memory cache for visualized content.
 */

type ContentState = {
  content: Record<string, string>;
  addContentToCache: (contentAddress: string, contentAsBase64: string) => void;
  resetContent: () => void;
};

export const useContentStore = create<ContentState>((set) => ({
  content: {},
  addContentToCache: (contentAddress, contentAsBase64) =>
    set((state) => ({
      content: { ...state.content, [contentAddress]: contentAsBase64 },
    })),
  resetContent: () => set({ content: {} }),
}));
