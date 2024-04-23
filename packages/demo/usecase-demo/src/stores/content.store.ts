import { create } from 'zustand';

/**
 * In-memory cache for visualized content.
 */

type ContentState = {
  content: Record<string, string>;
  addContentToCache: (contentAddress: string, objectURL: string) => void;
  resetContent: () => void;
};

export const useContentStore = create<ContentState>((set) => ({
  content: {},
  addContentToCache: (contentAddress, objectURL) =>
    set((state) => ({
      content: { ...state.content, [contentAddress]: objectURL },
    })),
  resetContent: () => set({ content: {} }),
}));
