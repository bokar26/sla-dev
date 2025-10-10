import { create } from "zustand";
import { apiGet, apiPost } from "../lib/api";

export const useAccountStore = create<{
  user: { id: string; email: string } | null;
  plan: { name: string } | null;
  coinBalance: number;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  openBillingPortal: () => void;
  loadUser: () => Promise<void>;
}>((set, get) => ({
  user: null,
  plan: { name: "Starter" },
  coinBalance: 120,
  signIn: async () => {
    // TODO: Implement OAuth flow for mobile
    // For now, just set a mock user
    set({ user: { id: "1", email: "user@example.com" } });
  },
  signOut: async () => {
    try {
      await apiPost("/auth/logout");
    } catch (e) {
      console.warn("Logout error:", e);
    }
    set({ user: null });
  },
  openBillingPortal: () => {
    // TODO: Open WebView or deep link to billing portal
    console.log("Opening billing portal...");
  },
  loadUser: async () => {
    try {
      const user = await apiGet("/auth/me");
      set({ user });
    } catch (e) {
      console.warn("Failed to load user:", e);
      set({ user: null });
    }
  }
}));
