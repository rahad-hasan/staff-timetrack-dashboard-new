/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColorState {
    logInUserData: Record<string, any>;
    setLogInUserData: (userData: Record<string, any>) => void;
    resetData: () => void;
    updateUserData: (updates: any) => void;
}

export const useLogInUserStore = create<ColorState>()(
    persist(
        (set) => ({
            logInUserData: {},
            setLogInUserData: (userData) => set({ logInUserData: userData }),
            resetData: () => set({ logInUserData: {} }),
            updateUserData: (updates: any) => set((state) => ({
                logInUserData: {
                    ...state.logInUserData,
                    ...updates,
                }
            })),
        }),
        {
            name: "log-in-user",
        }
    )
);
