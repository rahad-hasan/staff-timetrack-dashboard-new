/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColorState {
    logInUserData: Record<string, any>;
    setLogInUserData: (userData: Record<string, any>) => void;
    resetData: () => void;
    updateUserData: (updates: any) => void;
}

/**
 * The signed-in user, persisted to localStorage ("log-in-user").
 *
 * A CACHE of server identity, not its source: seeded at sign-in
 * (`beginClientSession`), kept in step with the live session by `SessionSync`
 * (role, name, email, time zone, company) and by the profile read in
 * `useProfileImage` (avatar, phone), and wiped by `resetClientSession`. It can
 * be empty — a fresh browser, blocked storage — until `SessionSync` fills it,
 * so a reader must cope with `{}`. Server-side role gates use
 * `getDecodedUser()`, never this.
 */
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
