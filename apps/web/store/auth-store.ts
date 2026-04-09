"use client";

import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingEmail: string | null;
  pendingName: string | null;
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setPendingEmail: (email: string | null) => void;
  setPendingName: (name: string | null) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  pendingEmail: null,
  pendingName: null,
  setUser: (user) => set({ user }),
  setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
  setPendingEmail: (email) => set({ pendingEmail: email }),
  setPendingName: (name) => set({ pendingName: name }),
  clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, pendingEmail: null, pendingName: null }),
}));
