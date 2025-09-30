import { create } from "zustand";

export const useOrdersStore = create<any>((set) => ({
  items: {},
  order: [],
  setAll: (arr: any[]) => set(() => ({
    items: Object.fromEntries(arr.map(o => [o.id, o])),
    order: arr.map(o => o.id)
  })),
  addMany: (arr: any[]) => set(s => {
    const items = { ...s.items };
    const order = [...s.order];
    for (const o of arr) {
      if (!items[o.id]) order.unshift(o.id);
      items[o.id] = o;
    }
    return { items, order };
  }),
  add: (o: any) => set(s => ({
    items: { ...s.items, [o.id]: o },
    order: s.order.includes(o.id) ? s.order : [o.id, ...s.order]
  })),
}));
