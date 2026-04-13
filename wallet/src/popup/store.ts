import { create } from "zustand";
import type { WalletUiState } from "@/shared/types";
import * as msg from "./messaging";

interface WalletStore {
  state: WalletUiState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  state: null,
  loading: true,
  error: null,
  clearError: () => set({ error: null }),
  refresh: async () => {
    try {
      const state = await msg.getState();
      set({ state, loading: false, error: null });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load",
        loading: false,
      });
    }
  },
}));
