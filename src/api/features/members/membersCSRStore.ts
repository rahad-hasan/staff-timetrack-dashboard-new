/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { baseApi } from "@/api/baseApi";
import { create } from "zustand";

interface MembersStore {
    isMemberAdding: boolean;
    error: string | null;

    addEmployee: (data: {
        name: string,
        email: string,
        role: string,
        password: string,
    }) => Promise<any>;
    clearError: () => void;
}

export const useMembersStore = create<MembersStore>()(

    (set) => ({
        isMemberAdding: false,
        error: null,

        clearError: () => set({ error: null }),

        addEmployee: async (data) => {
            set({ isMemberAdding: true, error: null });

            try {
                const result = await baseApi("/auth/employees", {
                    method: "POST",
                    data,
                });

                if (!result.success) {
                    set({ error: result.message });
                    return result;
                }

                return result;
            } finally {
                set({ isMemberAdding: false });
            }
        },

    }),
);
