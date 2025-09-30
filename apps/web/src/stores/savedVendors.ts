import { create } from "zustand";

export type SavedVendor = {
  vendorId: string;
  name?: string;
  country?: string;
  region?: string;
  vendor_type?: "factory" | "supplier";
  createdAt?: string;
};

type State = {
  items: Record<string, SavedVendor>;
  order: string[]; // keep display order
  upserting: Record<string, boolean>;
  setAll: (items: SavedVendor[]) => void;
  addOrUpdate: (item: SavedVendor) => void;
  setUpserting: (id: string, v: boolean) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

export const useSavedVendors = create<State>((set, get) => ({
  items: {},
  order: [],
  upserting: {},
  setAll: (arr) =>
    set(() => ({
      items: Object.fromEntries(arr.map(v => [v.vendorId, v])),
      order: arr.map(v => v.vendorId),
    })),
  addOrUpdate: (v) =>
    set((s) => {
      const items = { ...s.items, [v.vendorId]: { ...(s.items[v.vendorId] || {}), ...v } };
      const exists = s.order.includes(v.vendorId);
      const order = exists ? s.order : [v.vendorId, ...s.order]; // new on top
      return { items, order };
    }),
  setUpserting: (id, val) => set((s) => ({ upserting: { ...s.upserting, [id]: val } })),
  has: (id) => !!get().items[id],
  clear: () => set({ items: {}, order: [], upserting: {} }),
}));
