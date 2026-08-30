import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ColorState {
  color: string;
  setColor: (color: string) => void;
}

export const useColorStore = create<ColorState>()(
  persist(
    (set) => ({
      // color: "#12cd69",
      color: "#0788f3",
      setColor: (color) => set({ color }),
    }),
    {
      name: "theme-color",
    }
  )
);
