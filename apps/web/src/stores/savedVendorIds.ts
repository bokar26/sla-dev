import { create } from "zustand";

type State = {
  ids: Set<string>;
  loading: boolean;
  setIds: (ids: string[]) => void;
  addId: (id: string) => void;
  removeId: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  setLoading: (loading: boolean) => void;
};

export const useSavedVendorIds = create<State>((set, get) => ({
  ids: new Set(),
  loading: false,
  setIds: (ids) => set({ ids: new Set(ids) }),
  addId: (id) => set((state) => {
    const newIds = new Set(state.ids);
    newIds.add(id);
    return { ids: newIds };
  }),
  removeId: (id) => set((state) => {
    const newIds = new Set(state.ids);
    newIds.delete(id);
    return { ids: newIds };
  }),
  has: (id) => get().ids.has(id),
  clear: () => set({ ids: new Set() }),
  setLoading: (loading) => set({ loading }),
}));
