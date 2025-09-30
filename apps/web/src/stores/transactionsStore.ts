import { create } from "zustand";

export const useTransactionsStore = create<any>((set) => ({
  items: {},
  order: [],
  setAll: (arr: any[]) => set(() => ({
    items: Object.fromEntries(arr.map(t => [t.id, t])),
    order: arr.map(t => t.id)
  })),
  addMany: (arr: any[]) => set(s => {
    const items = { ...s.items };
    const order = [...s.order];
    for (const t of arr) {
      if (!items[t.id]) order.unshift(t.id);
      items[t.id] = t;
    }
    return { items, order };
  }),
  add: (t: any) => set(s => ({
    items: { ...s.items, [t.id]: t },
    order: s.order.includes(t.id) ? s.order : [t.id, ...s.order]
  })),
}));
