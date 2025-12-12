/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { baseApi } from "@/api/baseApi";
import { create } from "zustand";

// export interface Project {
//   id: number;
//   name: string;
// }

interface AuthStore {
    isLogging: boolean;
    //   isUpdating: boolean;
    //   isDeleting: boolean;
    error: string | null;
    user: any;

    logIn: (data: {
        email: string,
        password: string,
    }) => Promise<void>;
    //   updateProject: (id: number, data: Partial<Project>, token: string) => Promise<void>;
    //   deleteProject: (id: number, token: string) => Promise<void>;

    clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    isLogging: false,
    error: null,
    user: null,

    clearError: () => set({ error: null }),

    // getUser: () => {
    //    return get().user
    // },
    // getError: () => get().error,

    logIn: async (data) => {
        try {
            set({ isLogging: true });

            const result = await baseApi("/auth/signin", {
                method: "POST",
                data,
                // token,
                cache: "no-store",
            });
            // const res = await result.JSON();
            // console.log(res);
            if (!result.success) {
                set({ error: result?.message })
            }
            if (result.success) {
                set({ user: result?.data })
                // console.log(result);
            }
            return result;

        } catch (err: any) {
            console.log('from catch', err);
            // set({ error: err.message });

        } finally {
            set({ isLogging: false });
        }
    },

}));
