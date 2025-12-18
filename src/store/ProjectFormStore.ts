/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

type ProjectFormStore = {
  data: Record<string, any>;
  updateData: (values: Record<string, any>) => void;
  resetData: () => void;
};

export const useProjectFormStore = create<ProjectFormStore>((set) => ({
  data: {},

  updateData: (values) =>
    set((state) => ({
      data: { ...state.data, ...values },
    })),

  resetData: () => set({ data: {} }),
}));
