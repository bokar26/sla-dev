import { create } from "zustand";

export type SavedClient = {
  id: string;
  company?: string;
  name?: string;
  contact?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
};

type State = {
  items: Record<string, SavedClient>;
  order: string[];
  setAll: (arr: SavedClient[]) => void;
  addMany: (arr: SavedClient[]) => void;
  add: (c: SavedClient) => void;
};

export const useSavedClients = create<State>((set) => ({
  items: {}, order: [],
  setAll: (arr) => set(() => ({
    items: Object.fromEntries(arr.map(c => [c.id, c])),
    order: arr.map(c => c.id),
  })),
  addMany: (arr) => set((s) => {
    const items = { ...s.items }; const order = [...s.order];
    for (const c of arr) { if (!items[c.id]) order.unshift(c.id); items[c.id] = c; }
    return { items, order };
  }),
  add: (c) => set((s)=>({ items:{...s.items,[c.id]:c}, order:s.order.includes(c.id)?s.order:[c.id, ...s.order] })),
}));
