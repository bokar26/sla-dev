import { create } from "zustand";

type Query = { 
  id: string; 
  item: string; 
  country: string; 
  productType: string; 
  quantity: string; 
  customization: "yes"|"no" 
};

export const useHistoryStore = create<{
  history: Query[];
  loadToForm: (q: Query) => void;
}>((set) => ({
  history: [],
  loadToForm: (_q) => { 
    /* TODO: bridge back to search form via a global event or a navigation param */ 
  }
}));
