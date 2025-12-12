/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { baseApi } from "@/api/baseApi";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  isLogging: boolean;
  error: string | null;
  user: any;

  logIn: (data: { email: string; password: string }) => Promise<any>;
  logOut: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLogging: false,
      error: null,
      user: null,

      clearError: () => set({ error: null }),

      logIn: async (data) => {
        set({ isLogging: true, error: null });

        try {
          const result = await baseApi("/auth/signin", {
            method: "POST",
            data,
          });

          if (!result.success) {
            set({ error: result.message });
            return result;
          }

          set({ user: result.data });
          return result;
        } finally {
          set({ isLogging: false });
        }
      },

      logOut: () => set({ user: null }),
    }),
    {
      name: "auth-store", // key in localStorage
      partialize: (state) => ({ user: state.user }), // persist only user
    }
  )
);
