// src/store/auth.ts

import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (t: string | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  token:
    typeof window !== "undefined" && localStorage.getItem("token")
      ? localStorage.getItem("token")
      : null,

  setToken: (t) => {
    if (t) {
      localStorage.setItem("token", t);
      set({ token: t });
    } else {
      localStorage.removeItem("token");
      set({ token: null });
    }
  },
}));

