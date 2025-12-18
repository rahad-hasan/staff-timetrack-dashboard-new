/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { baseApi } from "@/api/baseApi";
import { create } from "zustand";

interface ProjectsStore {
    isProjectAdding: boolean;
    isProjectEditing: boolean;
    isProjectDeleting: boolean;
    error: string | null;

    addProject: (data: {
        name: string,
        email: string,
        role: string,
        password: string,
    }) => Promise<any>;
    clearError: () => void;

    editProject: (params: {
        data: {
            name: string,
            // email: string,
            role: string,
            password: string,
        },
        id: number | undefined
    }) => Promise<any>;

    deleteProject: (params: {
        data: {
            is_active: boolean
        },
        id: number | undefined
    }) => Promise<any>;
}

export const useProjectsStore = create<ProjectsStore>()(

    (set) => ({
        isProjectAdding: false,
        isProjectEditing: false,
        isProjectDeleting: false,
        error: null,

        clearError: () => set({ error: null }),

        addProject: async (data) => {
            set({ isProjectAdding: true, error: null });

            try {
                const result = await baseApi("/projects", {
                    method: "POST",
                    data,
                });

                if (!result.success) {
                    set({ error: result.message });
                    return result;
                }

                return result;
            } finally {
                set({ isProjectAdding: false });
            }
        },
        
        editProject: async ({ data, id }) => {
            set({ isProjectEditing: true, error: null });

            try {
                const result = await baseApi(`/projects/${id}`, {
                    method: "PATCH",
                    data,
                });

                if (!result.success) {
                    set({ error: result.message });
                    return result;
                }

                return result;
            } finally {
                set({ isProjectEditing: false });
            }
        },

        deleteProject: async ({ data, id }) => {
            set({ isProjectDeleting: true, error: null });

            try {
                const result = await baseApi(`/projects/${id}`, {
                    method: "DELETE",
                    data,
                });

                if (!result.success) {
                    set({ error: result.message });
                    return result;
                }

                return result;
            } finally {
                set({ isProjectDeleting: false });
            }
        },
    }),
);
