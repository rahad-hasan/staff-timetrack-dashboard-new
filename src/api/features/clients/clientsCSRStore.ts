/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { baseApi } from "@/api/baseApi";
import { create } from "zustand";

interface ClientsStore {
    isClientAdding: boolean;
    isClientEditing: boolean;
    isClientDeleting: boolean;
    error: string | null;

    addClient: (data: {
        name: string,
        address: string,
        email: string,
        phone: string
    }) => Promise<any>;
    clearError: () => void;

    editClient: (params: {
        data: {
            name: string,
            // email: string,
            role: string,
            password: string,
        },
        id: number | undefined
    }) => Promise<any>;

    deleteClient: (params: {
        data: {
            is_active: boolean
        },
        id: number | undefined
    }) => Promise<any>;
}

export const useClientsStore = create<ClientsStore>()(

    (set) => ({
        isClientAdding: false,
        isClientEditing: false,
        isClientDeleting: false,
        error: null,

        clearError: () => set({ error: null }),

        addClient: async (data) => {
            set({ isClientAdding: true, error: null });

            try {
                const result = await baseApi("/clients", {
                    method: "POST",
                    data,
                });

                if (!result.success) {
                    set({ error: result.message });
                    return result;
                }

                return result;
            } finally {
                set({ isClientAdding: false });
            }
        },

        editClient: async ({ data, id }) => {
            set({ isClientEditing: true, error: null });

            try {
                const result = await baseApi(`/clients/${id}`, {
                    method: "PATCH",
                    data,
                });

                if (!result.success) {
                    set({ error: result.message });
                    return result;
                }

                return result;
            } finally {
                set({ isClientEditing: false });
            }
        },

        deleteClient: async ({ data, id }) => {
            set({ isClientDeleting: true, error: null });

            try {
                const result = await baseApi(`/clients/${id}`, {
                    method: "PATCH",
                    data,
                });

                if (!result.success) {
                    set({ error: result.message });
                    return result;
                }

                return result;
            } finally {
                set({ isClientDeleting: false });
            }
        },
    }),
);
