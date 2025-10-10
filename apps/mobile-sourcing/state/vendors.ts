import { create } from "zustand";

type Vendor = { 
  id: string; 
  name: string; 
  country: string; 
  productType: string; 
  kind?: "supplier"|"factory" 
};

type State = {
  saved: Record<string, Vendor>;
  filters: { country?: string; productType?: string };
  saveVendor: (v: Vendor) => void;
  removeVendor: (id: string) => void;
  setFilter: (k: "country"|"productType", v: string) => void;
  savedSuppliers: () => Vendor[];
  savedFactories: () => Vendor[];
};

export const useVendorsStore = create<State>((set, get) => ({
  saved: {},
  filters: {},
  saveVendor: (v) => set((s)=>({ saved: { ...s.saved, [v.id]: v }})),
  removeVendor: (id) => set((s)=>{ 
    const next = { ...s.saved }; 
    delete next[id]; 
    return { saved: next }; 
  }),
  setFilter: (k, v) => set((s)=>({ filters: { ...s.filters, [k]: v || undefined }})),
  savedSuppliers: () => {
    const { saved, filters } = get();
    return Object.values(saved).filter(v => (v.kind !== "factory")
      && (!filters.country || v.country?.toLowerCase().includes(filters.country.toLowerCase()))
      && (!filters.productType || v.productType?.toLowerCase().includes(filters.productType.toLowerCase())));
  },
  savedFactories: () => {
    const { saved, filters } = get();
    return Object.values(saved).filter(v => (v.kind === "factory")
      && (!filters.country || v.country?.toLowerCase().includes(filters.country.toLowerCase()))
      && (!filters.productType || v.productType?.toLowerCase().includes(filters.productType.toLowerCase())));
  }
}));
