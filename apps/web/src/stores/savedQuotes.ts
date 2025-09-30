import { create } from "zustand";

export type SavedQuote = {
  id: string;
  vendorId?: string;
  fileUrl: string;
  fileType: "pdf" | "png";
  amount?: number;
  currency?: string;
  notes?: string;
  createdAt?: string;
  title?: string;
  vendorName?: string;
  status?: string;
};

type State = {
  items: Record<string, SavedQuote>;
  order: string[];
  setAll: (arr: SavedQuote[]) => void;
  addMany: (arr: SavedQuote[]) => void;
  add: (q: SavedQuote) => void;
};

export const useSavedQuotes = create<State>((set) => ({
  items: {},
  order: [],
  setAll: (arr) =>
    set(() => ({
      items: Object.fromEntries(arr.map(q => [q.id, q])),
      order: arr.map(q => q.id),
    })),
  addMany: (arr) =>
    set((s) => {
      const items = { ...s.items };
      const order = [...s.order];
      for (const q of arr) {
        if (!items[q.id]) order.unshift(q.id);
        items[q.id] = q;
      }
      return { items, order };
    }),
  add: (q) =>
    set((s) => ({
      items: { ...s.items, [q.id]: q },
      order: s.order.includes(q.id) ? s.order : [q.id, ...s.order],
    })),
}));
